-- ============================================================
-- SEED DATA for PlacementPro Demo
-- ============================================================

-- Skills
insert into public.skills (name, category) values
  ('Python', 'programming'),
  ('Java', 'programming'),
  ('JavaScript', 'programming'),
  ('TypeScript', 'programming'),
  ('React', 'frontend'),
  ('Node.js', 'backend'),
  ('SQL', 'database'),
  ('Machine Learning', 'ai'),
  ('Data Analysis', 'data'),
  ('Data Structures', 'programming'),
  ('Algorithms', 'programming'),
  ('System Design', 'architecture'),
  ('Problem Solving', 'aptitude'),
  ('Communication', 'soft'),
  ('Teamwork', 'soft'),
  ('Leadership', 'soft'),
  ('C++', 'programming'),
  ('Go', 'programming'),
  ('Docker', 'devops'),
  ('Git', 'tools')
on conflict (name) do nothing;

-- Proctoring Rules
insert into public.proctoring_rules (rule_name, event_type, threshold, severity, notify_admin) values
  ('Multiple Persons Detected', 'multiple_persons', 1, 'high', true),
  ('No Face Detected', 'no_face', 3, 'medium', true),
  ('Tab Switch', 'tab_switch', 2, 'medium', true),
  ('Window Blur', 'window_blur', 3, 'low', false),
  ('Prolonged Absence', 'prolonged_absence', 1, 'high', true),
  ('Face Visibility Change', 'face_visibility', 5, 'low', false);

-- Assessments
insert into public.assessments (title, description, category, duration_minutes, total_marks, pass_marks) values
  ('Aptitude Test – Quantitative Section', 'Tests mathematical reasoning, problem solving and quantitative aptitude', 'aptitude', 60, 100, 40),
  ('Programming Skills Assessment', 'Tests programming concepts, DSA and code comprehension', 'programming', 90, 100, 40),
  ('Communication Skills Assessment', 'Tests grammar, vocabulary, reading comprehension and writing', 'communication', 60, 100, 40);

-- Sample Questions (Aptitude)
insert into public.question_bank (question, option_a, option_b, option_c, option_d, correct_answer, topic, difficulty, category) values
  ('If a train travels 120 km in 2 hours, what is its average speed?', '50 km/h', '60 km/h', '70 km/h', '80 km/h', 'B', 'Speed & Distance', 'easy', 'aptitude'),
  ('A man buys a TV for Rs.15,000 and sells it for Rs.18,000. What is his profit percentage?', '15%', '18%', '20%', '25%', 'C', 'Profit & Loss', 'easy', 'aptitude'),
  ('If 8 workers can complete a job in 12 days, how many days will 6 workers take?', '14 days', '16 days', '18 days', '20 days', 'B', 'Work & Time', 'medium', 'aptitude'),
  ('What is the next number in the series: 2, 6, 12, 20, 30, ?', '40', '42', '44', '46', 'B', 'Number Series', 'medium', 'aptitude'),
  ('A pipe can fill a tank in 4 hours. Another pipe can empty it in 6 hours. If both are open together, when will the tank be full?', '8 hours', '10 hours', '12 hours', '14 hours', 'C', 'Pipes & Cisterns', 'hard', 'aptitude'),
  ('The simple interest on Rs.5000 at 8% per annum for 3 years is?', 'Rs.1000', 'Rs.1200', 'Rs.1400', 'Rs.1600', 'B', 'Simple Interest', 'easy', 'aptitude'),
  ('In a 100m race, A beats B by 10m and B beats C by 10m. By how much does A beat C?', '18m', '19m', '20m', '21m', 'B', 'Races', 'medium', 'aptitude'),
  ('Find the missing term: 1, 4, 9, 16, 25, ?', '30', '35', '36', '40', 'C', 'Number Series', 'easy', 'aptitude');

-- Sample Questions (Programming)
insert into public.question_bank (question, option_a, option_b, option_c, option_d, correct_answer, topic, difficulty, category) values
  ('What is the time complexity of binary search?', 'O(n)', 'O(n log n)', 'O(log n)', 'O(1)', 'C', 'Algorithms', 'easy', 'programming'),
  ('Which data structure uses LIFO principle?', 'Queue', 'Stack', 'Linked List', 'Tree', 'B', 'Data Structures', 'easy', 'programming'),
  ('What does OOP stand for?', 'Object Oriented Processing', 'Object Oriented Programming', 'Oriented Object Programming', 'None of the above', 'B', 'OOP Concepts', 'easy', 'programming'),
  ('Which sorting algorithm has best average case complexity?', 'Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort', 'C', 'Sorting', 'medium', 'programming'),
  ('What is a deadlock in operating systems?', 'A process waiting for CPU', 'Two processes waiting for each other indefinitely', 'A process that crashes', 'Memory overflow', 'B', 'OS Concepts', 'medium', 'programming');

-- Sample Questions (Communication)
insert into public.question_bank (question, option_a, option_b, option_c, option_d, correct_answer, topic, difficulty, category) values
  ('Which sentence is grammatically correct?', 'He go to school every day.', 'He goes to school every day.', 'He going to school every day.', 'He gone to school every day.', 'B', 'Grammar', 'easy', 'communication'),
  ('What is the synonym of "Eloquent"?', 'Silent', 'Articulate', 'Confused', 'Hesitant', 'B', 'Vocabulary', 'medium', 'communication'),
  ('The passage says the company was founded in 1990. What type of question is this?', 'Inference question', 'Fact-based question', 'Opinion question', 'Analysis question', 'B', 'Reading Comprehension', 'easy', 'communication');
