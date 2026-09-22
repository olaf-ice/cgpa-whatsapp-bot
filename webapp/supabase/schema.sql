-- Create Institutions Table
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'Federal University', 'Private University', 'Polytechnic'
    grading_scale NUMERIC(3,1) NOT NULL, -- 4.0, 5.0, 7.0
    grade_boundaries JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Institutions
INSERT INTO institutions (name, type, grading_scale, grade_boundaries) VALUES
-- Federal Universities (5.0 Scale)
('University of Ibadan (UI)', 'Federal University', 7.0, 
 '{"A": {"min_score": 70, "points": 7}, "A-": {"min_score": 65, "points": 6}, "B+": {"min_score": 60, "points": 5}, "B": {"min_score": 55, "points": 4}, "B-": {"min_score": 50, "points": 3}, "C+": {"min_score": 45, "points": 2}, "C": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('University of Lagos (UNILAG)', 'Federal University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Obafemi Awolowo University (OAU)', 'Federal University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Ahmadu Bello University (ABU)', 'Federal University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('University of Ilorin (UNILORIN)', 'Federal University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('University of Nigeria, Nsukka (UNN)', 'Federal University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('University of Benin (UNIBEN)', 'Federal University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Federal University of Technology, Minna (FUTMINNA)', 'Federal University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Federal University of Technology, Akure (FUTA)', 'Federal University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Federal University of Technology, Owerri (FUTO)', 'Federal University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Nnamdi Azikiwe University (UNIZIK)', 'Federal University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('University of Jos (UNIJOS)', 'Federal University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('University of Abuja (UNIABUJA)', 'Federal University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('University of Port Harcourt (UNIPORT)', 'Federal University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),

-- State Universities (5.0 Scale)
('Lagos State University (LASU)', 'State University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Olabisi Onabanjo University (OOU)', 'State University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Ekiti State University (EKSU)', 'State University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Delta State University (DELSU)', 'State University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),

-- Private Universities (5.0 Scale)
('Covenant University', 'Private University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Babcock University', 'Private University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Afe Babalola University (ABUAD)', 'Private University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Lead City University (LCU)', 'Private University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),

-- Polytechnics (4.0 Scale)
('Yaba College of Technology (YABATECH)', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Lagos State Polytechnic (LASPOTECH)', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Federal Polytechnic Ilaro (ILAROPOLY)', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('The Polytechnic, Ibadan (PolyIbadan)', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('The Oke-Ogun Polytechnic, Saki (TOPS)', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('The Ibarapa Polytechnic, Eruwa', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Federal Polytechnic, Nekede', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Federal Polytechnic, Oko', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Federal Polytechnic, Ede', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Federal Polytechnic, Ado-Ekiti', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Kaduna Polytechnic (KADPOLY)', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Auchi Polytechnic', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Kwara State Polytechnic', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Rufus Giwa Polytechnic', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Polytechnic of Ibadan', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('FUTA', 'Federal University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('LAUTECH', 'State University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb);


-- Create Students Table
-- Note: Assuming auth.users is present from Supabase Auth
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE, -- REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    matric_number VARCHAR(50),
    institution_id UUID REFERENCES institutions(id) ON DELETE RESTRICT,
    course_of_study VARCHAR(255) NOT NULL,
    entry_level INTEGER NOT NULL DEFAULT 100,
    current_level INTEGER NOT NULL DEFAULT 100,
    phone_number VARCHAR(20) UNIQUE,
    email_reminders_enabled BOOLEAN DEFAULT true,
    has_paid BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    current_cgpa NUMERIC(4,2),
    opt_in_leaderboard BOOLEAN DEFAULT true,
    referral_code VARCHAR(50) UNIQUE,
    referred_by VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Reviews Table
CREATE TABLE course_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    course_code VARCHAR(20) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    advice_text TEXT NOT NULL,
    author_id UUID REFERENCES students(id) ON DELETE SET NULL, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_course_reviews_course ON course_reviews(institution_id, course_code);

ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to course_reviews" 
ON course_reviews FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert to course_reviews" 
ON course_reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Master Courses Table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    course_code VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    credit_units INTEGER NOT NULL,
    level INTEGER NOT NULL,
    term INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institution_id, course_code)
);

-- Create Semesters Table
CREATE TABLE semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    level INTEGER NOT NULL,
    term INTEGER NOT NULL,
    UNIQUE(student_id, level, term),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Grades Table
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL, 
    course_code VARCHAR(20) NOT NULL,
    credit_units INTEGER NOT NULL,
    grade VARCHAR(2),
    points NUMERIC(3,1), -- cached numerical points for historical accuracy and faster calculation
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own profile" ON students FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON students FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can read their own profile" ON students FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own semesters" ON semesters FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update their own semesters" ON semesters FOR UPDATE USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Users can read their own semesters" ON semesters FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete their own semesters" ON semesters FOR DELETE USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their own grades" ON grades FOR ALL USING (
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
