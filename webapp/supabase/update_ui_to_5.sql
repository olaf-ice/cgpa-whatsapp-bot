-- Update University of Ibadan (UI) to 5.0 Point Grading Scale
UPDATE institutions
SET 
    grading_scale = 5.0,
    grade_boundaries = '{
        "A": {"min_score": 70, "points": 5},
        "B": {"min_score": 60, "points": 4},
        "C": {"min_score": 50, "points": 3},
        "D": {"min_score": 45, "points": 2},
        "E": {"min_score": 40, "points": 1},
        "F": {"min_score": 0, "points": 0}
    }'::jsonb,
    updated_at = NOW()
WHERE name ILIKE '%University of Ibadan%';
