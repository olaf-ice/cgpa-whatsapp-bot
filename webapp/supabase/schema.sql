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

-- Seed Initial Institutions (4 Universities, 4 Polytechnics)
INSERT INTO institutions (name, type, grading_scale, grade_boundaries) VALUES
('University of Ibadan (UI)', 'Federal University', 7.0, 
 '{"A": {"min_score": 70, "points": 7}, "A-": {"min_score": 65, "points": 6}, "B+": {"min_score": 60, "points": 5}, "B": {"min_score": 55, "points": 4}, "B-": {"min_score": 50, "points": 3}, "C+": {"min_score": 45, "points": 2}, "C": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('University of Lagos (UNILAG)', 'Federal University', 5.0, 
 '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Obafemi Awolowo University (OAU)', 'Federal University', 5.0, 
 '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Ahmadu Bello University (ABU)', 'Federal University', 5.0, 
 '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Yaba College of Technology (YABATECH)', 'Polytechnic', 4.0, 
 '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('The Polytechnic, Ibadan (PolyIbadan)', 'Polytechnic', 4.0, 
 '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Lagos State Polytechnic (LASPOTECH)', 'Polytechnic', 4.0, 
 '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Federal Polytechnic Ilaro (ILAROPOLY)', 'Polytechnic', 4.0, 
 '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb);

-- Create Students Table
-- Note: Assuming auth.users is present from Supabase Auth
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE, -- REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    institution_id UUID REFERENCES institutions(id) ON DELETE RESTRICT,
    course_of_study VARCHAR(255) NOT NULL,
    entry_level INTEGER NOT NULL DEFAULT 100,
    current_level INTEGER NOT NULL DEFAULT 100,
    phone_number VARCHAR(20) UNIQUE,
    email_reminders_enabled BOOLEAN DEFAULT true,
    has_paid BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
