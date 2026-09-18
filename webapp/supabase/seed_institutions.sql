TRUNCATE institutions CASCADE;

INSERT INTO institutions (name, type, grading_scale, grade_boundaries) VALUES
-- Federal Universities
('University of Ibadan (UI)', 'Federal University', 4.0, '{"A": {"min_score": 70, "points": 4}, "B": {"min_score": 60, "points": 3}, "C": {"min_score": 50, "points": 2}, "D": {"min_score": 45, "points": 1}, "E": {"min_score": 40, "points": 0}, "F": {"min_score": 0, "points": 0}}'::jsonb),

-- Private Universities
('Lead City University (LCU)', 'Private University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('KolaDaisi University (KDU)', 'Private University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),
('Dominican University, Ibadan (DUI)', 'Private University', 5.0, '{"A": {"min_score": 70, "points": 5}, "B": {"min_score": 60, "points": 4}, "C": {"min_score": 50, "points": 3}, "D": {"min_score": 45, "points": 2}, "E": {"min_score": 40, "points": 1}, "F": {"min_score": 0, "points": 0}}'::jsonb),

-- Polytechnics
('The Polytechnic, Ibadan (PolyIbadan)', 'Polytechnic', 4.0, '{"A": {"min_score": 75, "points": 4.0}, "AB": {"min_score": 70, "points": 3.5}, "B": {"min_score": 65, "points": 3.25}, "BC": {"min_score": 60, "points": 3.0}, "C": {"min_score": 55, "points": 2.75}, "CD": {"min_score": 50, "points": 2.5}, "D": {"min_score": 45, "points": 2.25}, "E": {"min_score": 40, "points": 2.0}, "F": {"min_score": 0, "points": 0}}'::jsonb);
