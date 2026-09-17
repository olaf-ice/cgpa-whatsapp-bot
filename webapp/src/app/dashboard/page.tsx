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
  const { data, error } = await (supabase as any)
    .from('students')
    .select(`
      *,
      institution:institutions(name, grading_scale),
      semesters(
        level, term,
        grades(credit_units, points)
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
  
  const trendData: any[] = [];
  
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
        });
      }

      const semGPA = semUnits > 0 ? (semPoints / semUnits) : 0;
      trendData.push({
        semester: `${sem.level}L T${sem.term}`,
        gpa: Number(semGPA.toFixed(2))
      });
    });
  } else {
    // New user with no grades logged yet
    trendData.push({ semester: 'Current', gpa: 0.0 });
  }

  const currentCGPA = totalCreditUnits > 0 ? (totalGradePoints / totalCreditUnits) : 0.0;

  // --- Peer Benchmarking ---
  const { data: peers } = await (supabase as any)
    .from('students')
    .select('id, semesters(grades(credit_units, points))')
    .eq('institution_id', student.institution_id)
    .eq('course_of_study', student.course_of_study)

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

  // Referral stats
  const { count: referralsCount } = await (supabase as any)
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('referred_by', student.id);

  const liveStudentData = {
    name: student.name,
    matricNumber: student.matric_number,
    institution: student.institution.name,
    courseOfStudy: student.course_of_study,
    scale: student.institution.grading_scale,
    currentCGPA: currentCGPA,
    trendData: trendData,
    phoneNumber: student.phone_number,
    percentileRank,
    numericRank,
    totalPeers,
    coachInsight,
    emailRemindersEnabled: student.email_reminders_enabled !== false, // defaults to true
    isAdmin: student.is_admin === true,
    referralCode: student.referral_code,
    referralsCount: referralsCount || 0
  }

  // Sunk Cost Paywall
  if (!student.has_paid) {
    if (!student.is_admin) {
      return <LockedDashboardWrapper email={user.email || ''} name={student.name} />
    }
  }

  return <DashboardClient studentData={liveStudentData} />
}
