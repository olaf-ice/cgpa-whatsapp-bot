import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import DashboardClient from './DashboardClient'
import LockedDashboardWrapper from './LockedDashboardWrapper'


export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch student, institution, and their semesters with grades
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      institution:institutions(name, type, grading_scale),
      semesters(
        level, term,
        grades(course_code, grade, credit_units, points)
      )
    `)
    .eq('user_id', user.id)
    .single()

  const student = data as any;

  if (error || !student) {
    redirect('/onboarding')
  }

  // Calculate CGPA and prepare trend data
  let totalCreditUnits = 0;
  let totalGradePoints = 0;
  let totalUnitsPassed = 0;
  
  const trendData: any[] = [];
  
  // Maps to track carryovers
  // normalize code: remove spaces and uppercase
  const normalizeCode = (code: string) => (code || '').replace(/\s+/g, '').toUpperCase();
  const failedCourses = new Map<string, { code: string, level: number, term: number, units: number }>();
  const passedCourses = new Set<string>();
  
  if (student.semesters && student.semesters.length > 0) {
    // Sort semesters by level, then term
    const sortedSemesters = [...student.semesters].sort((a: any, b: any) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.term - b.term;
    });

    sortedSemesters.forEach((sem: any) => {
      let semUnits = 0;
      let semPoints = 0;

      if (sem.grades) {
        sem.grades.forEach((g: any) => {
          semUnits += g.credit_units;
          semPoints += g.points;
          
          totalCreditUnits += g.credit_units;
          totalGradePoints += g.points;
          
          if (g.points > 0 && g.grade !== 'F') {
            totalUnitsPassed += g.credit_units;
          }
          
          // Track carryovers
          const normCode = normalizeCode(g.course_code);
          if (normCode) {
            if (g.points === 0 || g.grade === 'F') {
              // Mark as failed in this semester
              failedCourses.set(normCode, { code: g.course_code.toUpperCase(), level: sem.level, term: sem.term, units: g.credit_units });
            } else if (g.points > 0) {
              // Passed
              passedCourses.add(normCode);
            }
          }
        });
      }

      const semGPA = semUnits > 0 ? (semPoints / semUnits) : 0;
      let levelLabel = `${sem.level}L`;
      if (student.institution?.type === 'Polytechnic') {
        if (sem.level === 100) levelLabel = 'ND 1';
        else if (sem.level === 200) levelLabel = 'ND 2';
        else if (sem.level === 300) levelLabel = 'HND 1';
        else if (sem.level === 400) levelLabel = 'HND 2';
      }

      trendData.push({
        semester: `${levelLabel} T${sem.term}`,
        gpa: Number(semGPA.toFixed(2))
      });
    });
  } else {
    // New user with no grades logged yet
    trendData.push({ semester: 'Current', gpa: 0.0 });
  }

  const currentCGPA = totalCreditUnits > 0 ? (totalGradePoints / totalCreditUnits) : 0.0;
  
  // Calculate outstanding carryovers
  const outstandingCarryovers: { code: string, level: number, term: number, units: number }[] = [];
  failedCourses.forEach((details, normCode) => {
    if (!passedCourses.has(normCode)) {
      outstandingCarryovers.push(details);
    }
  });

  // --- Concurrently fetch Peers and Referrals ---
  const [
    { data: peers },
    { count: referralsCount }
  ] = await Promise.all([
    supabase
      .from('students')
      .select('id, semesters(grades(credit_units, points))')
      .eq('institution_id', student.institution_id)
      .eq('course_of_study', student.course_of_study),
    supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', student.id)
  ]);

  let percentileRank = 1; // Default top 1% if alone
  let numericRank = 1;
  let totalPeers = 1;

  if (peers && peers.length > 0) {
    totalPeers = peers.length;
    const peerCgpas = peers.map((p: any) => {
      let u = 0, pt = 0;
      p.semesters?.forEach((s: any) => {
        s.grades?.forEach((g: any) => { u += g.credit_units; pt += g.points; })
      })
      return u > 0 ? pt / u : 0;
    }).sort((a: number, b: number) => b - a);

    const rankIndex = peerCgpas.filter((c: number) => c > currentCGPA).length;
    numericRank = rankIndex + 1;
    percentileRank = Math.max(1, Math.round((numericRank / totalPeers) * 100));
  }

  // --- Coach Insights ---
  let heavyCourseUnits = 0, heavyCoursePoints = 0;
  let lightCourseUnits = 0, lightCoursePoints = 0;

  student.semesters?.forEach((sem: any) => {
    sem.grades?.forEach((g: any) => {
      if (g.credit_units >= 3) {
        heavyCourseUnits += g.credit_units;
        heavyCoursePoints += g.points;
      } else {
        lightCourseUnits += g.credit_units;
        lightCoursePoints += g.points;
      }
    })
  });

  const heavyGPA = heavyCourseUnits > 0 ? (heavyCoursePoints / heavyCourseUnits) : 0;
  const lightGPA = lightCourseUnits > 0 ? (lightCoursePoints / lightCourseUnits) : 0;
  
  let coachInsight = "Log more courses to receive personalized insights on your academic performance.";
  if (totalCreditUnits > 0) {
    if (heavyGPA < lightGPA - 0.5) {
      coachInsight = "You consistently score lower in heavy (3+ unit) courses. Prioritize these earlier in the semester to dramatically boost your CGPA.";
    } else if (lightGPA < heavyGPA - 0.5) {
      coachInsight = "You perform excellently in heavy courses, but lose easy points in 1-2 unit courses. Don't neglect your electives!";
    } else {
      coachInsight = "Your performance is highly balanced across all course weights. Keep up this consistent effort!";
    }
  }

  const liveStudentData = {
    name: student.name,
    matricNumber: student.matric_number,
    institution: student.institution?.name || 'Unknown Institution',
    courseOfStudy: student.course_of_study,
    scale: student.institution?.grading_scale || 5.0,
    currentCGPA: Number(currentCGPA.toFixed(2)),
    trendData: trendData,
    phoneNumber: student.phone_number,
    percentileRank,
    numericRank,
    totalPeers,
    coachInsight,
    emailRemindersEnabled: student.email_reminders_enabled !== false, // defaults to true
    isAdmin: student.is_admin === true,
    referralCode: student.referral_code,
    referralsCount: referralsCount || 0,
    isAnonymous: user.is_anonymous === true,
    outstandingCarryovers,
    totalUnitsRegistered: totalCreditUnits,
    totalUnitsPassed,
    targetGraduationUnits: student.target_graduation_units
  }

  if (!student.has_paid) {
    const email = user.email?.toLowerCase().trim() || '';
    const isSimeon = email === 'simeoncranier@gmail.com' || email === 'timileyinsimeon@gmail.com';
    if (!student.is_admin && !isSimeon) {
      // Calculate dynamic pricing based on institution type
      let paymentAmount = 2000; // default
      const instType = student.institution?.type || '';
      
      if (instType === 'Federal University') {
        paymentAmount = 3000;
      } else if (instType === 'State University') {
        paymentAmount = 3000;
      } else if (instType === 'Private University') {
        paymentAmount = 5000;
      } else if (instType === 'Polytechnic') {
        paymentAmount = 2500;
      }

      return <LockedDashboardWrapper email={user.email || ''} name={student.name} amount={paymentAmount} />
    }
  }

  return <DashboardClient studentData={liveStudentData} />
}
