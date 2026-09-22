-- Fix RLS Policies for the Students table and other user-owned tables
-- You can run this script directly in the Supabase SQL Editor.

-- Enable RLS on core tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Users can insert their own profile" ON students;
DROP POLICY IF EXISTS "Users can update their own profile" ON students;
DROP POLICY IF EXISTS "Users can read their own profile" ON students;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON students;

DROP POLICY IF EXISTS "Users can insert their own semesters" ON semesters;
DROP POLICY IF EXISTS "Users can update their own semesters" ON semesters;
DROP POLICY IF EXISTS "Users can read their own semesters" ON semesters;
DROP POLICY IF EXISTS "Users can delete their own semesters" ON semesters;

DROP POLICY IF EXISTS "Users can manage their own grades" ON grades;

-- Strict Students table policies (ONLY owner can read/write their own row)
CREATE POLICY "Users can insert their own profile" ON students FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON students FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can read their own profile" ON students FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Semesters table policies
CREATE POLICY "Users can insert their own semesters" ON semesters FOR INSERT TO authenticated WITH CHECK (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update their own semesters" ON semesters FOR UPDATE TO authenticated USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Users can read their own semesters" ON semesters FOR SELECT TO authenticated USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete their own semesters" ON semesters FOR DELETE TO authenticated USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- Grades table policies
CREATE POLICY "Users can manage their own grades" ON grades FOR ALL TO authenticated USING (
    semester_id IN (SELECT id FROM semesters WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid()))
);

-- RPC Function for Leaderboard (Bypasses RLS to safely return ONLY public fields)
CREATE OR REPLACE FUNCTION get_leaderboard(p_institution_id UUID, p_course_of_study VARCHAR)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    opt_in_leaderboard BOOLEAN,
    current_cgpa NUMERIC,
    entry_level INTEGER,
    current_level INTEGER
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.opt_in_leaderboard,
        s.current_cgpa,
        s.entry_level,
        s.current_level
    FROM students s
    WHERE s.institution_id = p_institution_id
      AND s.course_of_study = p_course_of_study
    ORDER BY s.current_cgpa DESC NULLS LAST
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;
