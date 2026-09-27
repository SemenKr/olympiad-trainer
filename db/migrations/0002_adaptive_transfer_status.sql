ALTER TABLE learners
  ADD COLUMN brothers_ages_attempted boolean NOT NULL DEFAULT false,
  ADD COLUMN brothers_ages_solution_exposed boolean NOT NULL DEFAULT false;
