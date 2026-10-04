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
DROP POLICY IF EXISTS "Users can manage their own profile" ON students;

DROP POLICY IF EXISTS "Users can insert their own semesters" ON semesters;
DROP POLICY IF EXISTS "Users can update their own semesters" ON semesters;
DROP POLICY IF EXISTS "Users can read their own semesters" ON semesters;
DROP POLICY IF EXISTS "Users can delete their own semesters" ON semesters;
DROP POLICY IF EXISTS "Users can manage their own semesters" ON semesters;

DROP POLICY IF EXISTS "Users can manage their own grades" ON grades;

-- Strict Students table policies (ONLY owner can read/write their own row)
CREATE POLICY "Users can manage their own profile" ON students 
FOR ALL TO authenticated 
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Semesters table policies
CREATE POLICY "Users can manage their own semesters" ON semesters 
FOR ALL TO authenticated 
USING (student_id IN (SELECT id FROM students WHERE user_id::text = auth.uid()::text))
WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id::text = auth.uid()::text));

-- Grades table policies
CREATE POLICY "Users can manage their own grades" ON grades 
FOR ALL TO authenticated 
USING (semester_id IN (SELECT id FROM semesters WHERE student_id IN (SELECT id FROM students WHERE user_id::text = auth.uid()::text)))
WITH CHECK (semester_id IN (SELECT id FROM semesters WHERE student_id IN (SELECT id FROM students WHERE user_id::text = auth.uid()::text)));

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

-- RPC Function to safely save user profile without hitting RLS insert issues
CREATE OR REPLACE FUNCTION save_profile(
    p_name VARCHAR,
    p_matric VARCHAR,
    p_institution UUID,
    p_course VARCHAR,
    p_level INTEGER
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_existing_student RECORD;
    v_is_exempt BOOLEAN := FALSE;
    v_final_name VARCHAR;
    v_final_matric VARCHAR;
    v_final_course VARCHAR;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Fetch user email from auth.users
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

    -- Check if student already exists
    SELECT * INTO v_existing_student FROM students WHERE user_id = v_user_id;

    IF v_existing_student.id IS NOT NULL THEN
        -- Check exemption (Oladipupo Timileyin or admin)
        IF LOWER(TRIM(COALESCE(v_user_email, ''))) IN ('timileyinsimeon@gmail.com', 'simeoncranier@gmail.com')
           OR (LOWER(COALESCE(v_existing_student.name, '')) LIKE '%oladipupo%' AND LOWER(COALESCE(v_existing_student.name, '')) LIKE '%timileyin%')
           OR (LOWER(COALESCE(p_name, '')) LIKE '%oladipupo%' AND LOWER(COALESCE(p_name, '')) LIKE '%timileyin%')
           OR v_existing_student.is_admin = TRUE THEN
            v_is_exempt := TRUE;
        END IF;

        IF v_is_exempt THEN
            v_final_name := p_name;
            v_final_matric := p_matric;
            v_final_course := p_course;
        ELSE
            -- Preserve registered details if already set
            IF v_existing_student.name IS NOT NULL AND v_existing_student.name <> 'Student' AND TRIM(v_existing_student.name) <> '' THEN
                v_final_name := v_existing_student.name;
            ELSE
                v_final_name := p_name;
            END IF;

            IF v_existing_student.matric_number IS NOT NULL AND TRIM(v_existing_student.matric_number) <> '' THEN
                v_final_matric := v_existing_student.matric_number;
            ELSE
                v_final_matric := p_matric;
            END IF;

            IF v_existing_student.course_of_study IS NOT NULL AND TRIM(v_existing_student.course_of_study) <> '' THEN
                v_final_course := v_existing_student.course_of_study;
            ELSE
                v_final_course := p_course;
            END IF;
        END IF;

        UPDATE students SET
            name = v_final_name,
            matric_number = v_final_matric,
            institution_id = p_institution,
            course_of_study = v_final_course,
            current_level = p_level,
            updated_at = NOW()
        WHERE user_id = v_user_id;
    ELSE
        INSERT INTO students (user_id, name, matric_number, institution_id, course_of_study, entry_level, current_level)
        VALUES (v_user_id, p_name, p_matric, p_institution, p_course, p_level, p_level);
    END IF;
END;
$$;
