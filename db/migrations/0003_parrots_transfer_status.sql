ALTER TABLE learners
  ADD COLUMN parrots_attempted boolean NOT NULL DEFAULT false,
  ADD COLUMN parrots_solution_exposed boolean NOT NULL DEFAULT false;
