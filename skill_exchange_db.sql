-- =====================================================
-- DATABASE: skill_exchange_db
-- Complete MySQL Schema with FULL DUMMY DATA for Testing
-- =====================================================

-- Drop database if exists (for clean setup)
DROP DATABASE IF EXISTS skill_exchange_db;
CREATE DATABASE skill_exchange_db;
USE skill_exchange_db;

-- =====================================================
-- TABLE 1: users
-- =====================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    bio TEXT,
    avatar VARCHAR(255) DEFAULT NULL,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_sessions INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_active (is_active),
    INDEX idx_admin (is_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 2: skills
-- =====================================================
CREATE TABLE skills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 3: user_skills
-- =====================================================
CREATE TABLE user_skills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    skill_type ENUM('teach', 'learn') NOT NULL,
    proficiency_level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_skill (user_id, skill_id, skill_type),
    INDEX idx_user (user_id),
    INDEX idx_skill (skill_id),
    INDEX idx_type (skill_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 4: sessions
-- =====================================================
CREATE TABLE sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    student_id INT NOT NULL,
    skill_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    duration INT DEFAULT 60,
    mode ENUM('online', 'offline', 'hybrid') DEFAULT 'online',
    meeting_link VARCHAR(255),
    location VARCHAR(255),
    status ENUM('pending', 'accepted', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status),
    INDEX idx_date (session_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 5: messages
-- =====================================================
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    session_id INT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    INDEX idx_conversation (sender_id, receiver_id),
    INDEX idx_session (session_id),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 6: reviews
-- =====================================================
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (reviewee_id) REFERENCES users(id),
    UNIQUE KEY unique_review (session_id, reviewer_id),
    INDEX idx_reviewee (reviewee_id),
    INDEX idx_rating (rating),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 7: match_requests
-- =====================================================
CREATE TABLE match_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    skill_id INT,
    message TEXT,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id),
    INDEX idx_from (from_user_id),
    INDEX idx_to (to_user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 8: progress_tracking
-- =====================================================
CREATE TABLE progress_tracking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    sessions_completed INT DEFAULT 0,
    proficiency_level INT DEFAULT 1,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id),
    UNIQUE KEY unique_user_skill_progress (user_id, skill_id),
    INDEX idx_user (user_id),
    INDEX idx_skill (skill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 9: notifications
-- =====================================================
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 10: reports
-- =====================================================
CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reporter_id INT NOT NULL,
    reported_user_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (reported_user_id) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_reported (reported_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT SAMPLE SKILLS (15 skills)
-- =====================================================
INSERT INTO skills (name, category, icon) VALUES
('JavaScript', 'Programming', 'fab fa-js'),
('Python', 'Programming', 'fab fa-python'),
('React', 'Frontend', 'fab fa-react'),
('Node.js', 'Backend', 'fab fa-node'),
('HTML/CSS', 'Frontend', 'fab fa-html5'),
('UI/UX Design', 'Design', 'fas fa-paintbrush'),
('Digital Marketing', 'Marketing', 'fas fa-chart-line'),
('Data Science', 'Data', 'fas fa-database'),
('Machine Learning', 'AI', 'fas fa-brain'),
('Photography', 'Arts', 'fas fa-camera'),
('Video Editing', 'Media', 'fas fa-video'),
('Public Speaking', 'Soft Skills', 'fas fa-microphone'),
('Leadership', 'Soft Skills', 'fas fa-chalkboard-user'),
('Project Management', 'Business', 'fas fa-tasks'),
('Excel', 'Business', 'fas fa-table'),
('PHP', 'Programming', 'fab fa-php'),
('Laravel', 'Backend', 'fab fa-laravel'),
('Vue.js', 'Frontend', 'fab fa-vuejs'),
('Angular', 'Frontend', 'fab fa-angular'),
('TypeScript', 'Programming', 'fab fa-js'),
('AWS', 'Cloud', 'fab fa-aws'),
('Docker', 'DevOps', 'fab fa-docker'),
('Kubernetes', 'DevOps', 'fas fa-cubes'),
('Figma', 'Design', 'fab fa-figma'),
('SEO', 'Marketing', 'fas fa-search'),
('Content Writing', 'Marketing', 'fas fa-pen-fancy'),
('Social Media Marketing', 'Marketing', 'fab fa-instagram'),
('SQL', 'Database', 'fas fa-database'),
('MongoDB', 'Database', 'fas fa-leaf'),
('GraphQL', 'API', 'fas fa-project-diagram');

-- =====================================================
-- INSERT USERS (10 users with full data)
-- Password for all users is 'password123'
-- =====================================================

-- Admin User (ID: 1)
INSERT INTO users (email, password_hash, first_name, last_name, bio, avatar, rating, total_sessions, is_admin, is_active, created_at, last_login) VALUES
('admin@skillswap.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'Platform administrator with 10+ years of experience in EdTech. Passionate about creating meaningful learning experiences.', 'https://randomuser.me/api/portraits/men/1.jpg', 5.0, 45, 1, 1, '2023-01-01 10:00:00', '2024-03-20 09:00:00');

-- Regular Users (ID: 2-10)
INSERT INTO users (email, password_hash, first_name, last_name, bio, avatar, rating, total_sessions, is_admin, is_active, created_at, last_login) VALUES
('john.doe@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Doe', 'Full-stack developer with 8 years of experience. Love teaching JavaScript and React. Looking to learn Python for data analysis.', 'https://randomuser.me/api/portraits/men/2.jpg', 4.8, 32, 0, 1, '2023-02-15 14:30:00', '2024-03-19 15:00:00'),

('jane.smith@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Smith', 'Data scientist at Google. Expert in Python, Machine Learning, and Data Visualization. Want to learn React for dashboard building.', 'https://randomuser.me/api/portraits/women/1.jpg', 4.9, 28, 0, 1, '2023-03-10 11:20:00', '2024-03-18 10:30:00'),

('mike.johnson@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike', 'Johnson', 'UI/UX Designer specializing in Figma and Adobe XD. Looking to expand into frontend development with React.', 'https://randomuser.me/api/portraits/men/3.jpg', 4.5, 15, 0, 1, '2023-04-20 09:45:00', '2024-03-17 14:00:00'),

('sarah.wilson@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah', 'Wilson', 'Digital Marketing manager with expertise in SEO and Social Media. Want to learn data science to analyze marketing metrics.', 'https://randomuser.me/api/portraits/women/2.jpg', 4.2, 10, 0, 1, '2023-05-05 16:00:00', '2024-03-16 11:00:00'),

('ali.asad@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ali', 'Asad', 'Backend developer working with PHP and Laravel. Want to learn Node.js and modern JavaScript frameworks.', 'https://randomuser.me/api/portraits/men/4.jpg', 4.7, 22, 0, 1, '2023-06-12 13:15:00', '2024-03-15 09:30:00'),

('emma.davis@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emma', 'Davis', 'Professional photographer and video editor. Looking to learn digital marketing to grow my business.', 'https://randomuser.me/api/portraits/women/3.jpg', 4.6, 18, 0, 1, '2023-07-08 10:00:00', '2024-03-14 16:45:00'),

('ahmad.khan@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ahmad', 'Khan', 'Project manager with PMP certification. Want to learn leadership and public speaking skills.', 'https://randomuser.me/api/portraits/men/5.jpg', 4.4, 8, 0, 1, '2023-08-25 12:30:00', '2024-03-13 13:00:00'),

('fatima.rizvi@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Fatima', 'Rizvi', 'Excel expert and business analyst. Want to learn SQL and data science for career growth.', 'https://randomuser.me/api/portraits/women/4.jpg', 4.9, 35, 0, 1, '2023-09-18 15:45:00', '2024-03-12 10:15:00'),

('bilal.hassan@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bilal', 'Hassan', 'DevOps engineer with AWS certification. Want to learn Kubernetes and Docker deeply.', 'https://randomuser.me/api/portraits/men/6.jpg', 4.8, 20, 0, 1, '2023-10-30 11:00:00', '2024-03-11 08:30:00');

-- =====================================================
-- INSERT USER SKILLS (Teaching & Learning)
-- =====================================================

-- John Doe (ID: 2) - Teach: JavaScript, React, Node.js, HTML/CSS | Learn: Python, Data Science, Machine Learning
INSERT INTO user_skills (user_id, skill_id, skill_type, proficiency_level) VALUES
(2, 1, 'teach', 5), (2, 3, 'teach', 4), (2, 4, 'teach', 4), (2, 5, 'teach', 5),
(2, 2, 'learn', 2), (2, 8, 'learn', 1), (2, 9, 'learn', 1);

-- Jane Smith (ID: 3) - Teach: Python, Data Science, Machine Learning, SQL | Learn: React, JavaScript, UI/UX Design
INSERT INTO user_skills (user_id, skill_id, skill_type, proficiency_level) VALUES
(3, 2, 'teach', 5), (3, 8, 'teach', 5), (3, 9, 'teach', 4), (3, 28, 'teach', 5),
(3, 3, 'learn', 3), (3, 1, 'learn', 3), (3, 6, 'learn', 2);

-- Mike Johnson (ID: 4) - Teach: UI/UX Design, Figma, HTML/CSS | Learn: React, JavaScript, Node.js
INSERT INTO user_skills (user_id, skill_id, skill_type, proficiency_level) VALUES
(4, 6, 'teach', 5), (4, 24, 'teach', 5), (4, 5, 'teach', 4),
(4, 3, 'learn', 3), (4, 1, 'learn', 3), (4, 4, 'learn', 2);

-- Sarah Wilson (ID: 5) - Teach: Digital Marketing, SEO, Social Media Marketing | Learn: Data Science, Python, SQL
INSERT INTO user_skills (user_id, skill_id, skill_type, proficiency_level) VALUES
(5, 7, 'teach', 5), (5, 25, 'teach', 4), (5, 27, 'teach', 5),
(5, 8, 'learn', 2), (5, 2, 'learn', 2), (5, 28, 'learn', 1);

-- Ali Asad (ID: 6) - Teach: PHP, Laravel, Node.js | Learn: React, Vue.js, TypeScript
INSERT INTO user_skills (user_id, skill_id, skill_type, proficiency_level) VALUES
(6, 16, 'teach', 5), (6, 17, 'teach', 5), (6, 4, 'teach', 4),
(6, 3, 'learn', 3), (6, 18, 'learn', 2), (6, 20, 'learn', 2);

-- Emma Davis (ID: 7) - Teach: Photography, Video Editing | Learn: Digital Marketing, Social Media Marketing, SEO
INSERT INTO user_skills (user_id, skill_id, skill_type, proficiency_level) VALUES
(7, 10, 'teach', 5), (7, 11, 'teach', 4),
(7, 7, 'learn', 3), (7, 27, 'learn', 3), (7, 25, 'learn', 2);

-- Ahmad Khan (ID: 8) - Teach: Project Management, Leadership | Learn: Public Speaking, Leadership, Excel
INSERT INTO user_skills (user_id, skill_id, skill_type, proficiency_level) VALUES
(8, 14, 'teach', 5), (8, 13, 'teach', 4),
(8, 12, 'learn', 3), (8, 13, 'learn', 2), (8, 15, 'learn', 2);

-- Fatima Rizvi (ID: 9) - Teach: Excel, Project Management | Learn: SQL, Data Science, Python
INSERT INTO user_skills (user_id, skill_id, skill_type, proficiency_level) VALUES
(9, 15, 'teach', 5), (9, 14, 'teach', 4),
(9, 28, 'learn', 3), (9, 8, 'learn', 2), (9, 2, 'learn', 2);

-- Bilal Hassan (ID: 10) - Teach: AWS, Docker, Kubernetes | Learn: Python, Machine Learning
INSERT INTO user_skills (user_id, skill_id, skill_type, proficiency_level) VALUES
(10, 21, 'teach', 5), (10, 22, 'teach', 5), (10, 23, 'teach', 4),
(10, 2, 'learn', 2), (10, 9, 'learn', 2);

-- =====================================================
-- INSERT SESSIONS (15 sessions with various statuses)
-- =====================================================

-- Completed Sessions
INSERT INTO sessions (teacher_id, student_id, skill_id, title, description, session_date, session_time, duration, mode, meeting_link, status, created_at) VALUES
(2, 3, 1, 'JavaScript Fundamentals', 'Learn basic JavaScript concepts, variables, functions, and loops.', '2024-03-01', '14:00:00', 60, 'online', 'https://meet.google.com/abc-def-ghi', 'completed', '2024-02-25 10:00:00'),
(3, 2, 2, 'Python for Data Analysis', 'Introduction to Pandas and NumPy for data manipulation.', '2024-03-02', '15:30:00', 90, 'online', 'https://meet.google.com/jkl-mno-pqr', 'completed', '2024-02-26 11:00:00'),
(2, 4, 3, 'React Hooks Deep Dive', 'Learn useState, useEffect, useContext and custom hooks.', '2024-03-03', '10:00:00', 60, 'online', 'https://meet.google.com/stu-vwx-yz', 'completed', '2024-02-27 09:00:00'),
(3, 5, 8, 'Data Science Basics', 'Introduction to data science workflow and tools.', '2024-03-04', '13:00:00', 120, 'online', 'https://meet.google.com/abc-123-def', 'completed', '2024-02-28 14:00:00'),
(4, 2, 6, 'UI/UX Design Principles', 'Learn design thinking and user-centered design.', '2024-03-05', '11:00:00', 90, 'offline', NULL, 'completed', '2024-02-29 16:00:00'),
(5, 3, 7, 'Digital Marketing Strategy', 'Complete guide to modern digital marketing.', '2024-03-06', '14:30:00', 60, 'online', 'https://meet.google.com/456-789-xyz', 'completed', '2024-03-01 10:00:00');

-- Pending Sessions
INSERT INTO sessions (teacher_id, student_id, skill_id, title, description, session_date, session_time, duration, mode, meeting_link, location, status, created_at) VALUES
(6, 2, 16, 'PHP Backend Development', 'Learn PHP fundamentals and database integration.', '2024-03-25', '15:00:00', 90, 'online', 'https://meet.google.com/pending-001', NULL, 'pending', '2024-03-18 09:00:00'),
(7, 4, 10, 'Professional Photography Tips', 'Learn composition, lighting, and editing techniques.', '2024-03-26', '10:30:00', 120, 'offline', NULL, 'Downtown Studio, Karachi', 'pending', '2024-03-19 11:00:00'),
(8, 2, 14, 'Project Management Workshop', 'Learn Agile and Scrum methodologies.', '2024-03-27', '14:00:00', 180, 'online', 'https://meet.google.com/pending-002', NULL, 'pending', '2024-03-20 13:00:00'),
(9, 10, 15, 'Advanced Excel Techniques', 'Pivot tables, macros, and data analysis.', '2024-03-28', '11:00:00', 90, 'online', 'https://meet.google.com/pending-003', NULL, 'pending', '2024-03-21 15:00:00');

-- Accepted/Upcoming Sessions
INSERT INTO sessions (teacher_id, student_id, skill_id, title, description, session_date, session_time, duration, mode, meeting_link, status, created_at) VALUES
(2, 6, 4, 'Node.js API Development', 'Build RESTful APIs with Express and MongoDB.', '2024-04-01', '16:00:00', 90, 'online', 'https://meet.google.com/accepted-001', 'accepted', '2024-03-22 10:00:00'),
(3, 7, 9, 'Machine Learning Fundamentals', 'Introduction to ML algorithms and scikit-learn.', '2024-04-02', '13:30:00', 120, 'online', 'https://meet.google.com/accepted-002', 'accepted', '2024-03-23 14:00:00'),
(4, 9, 6, 'Figma Masterclass', 'Complete Figma training for UI/UX designers.', '2024-04-03', '10:00:00', 180, 'online', 'https://meet.google.com/accepted-003', 'accepted', '2024-03-24 09:30:00'),
(10, 2, 21, 'AWS Cloud Computing', 'Introduction to AWS services and cloud architecture.', '2024-04-05', '15:00:00', 120, 'online', 'https://meet.google.com/accepted-004', 'accepted', '2024-03-25 16:00:00');

-- Cancelled Sessions
INSERT INTO sessions (teacher_id, student_id, skill_id, title, description, session_date, session_time, duration, mode, meeting_link, status, created_at) VALUES
(2, 8, 1, 'JavaScript Advanced Concepts', 'Closures, promises, and async/await.', '2024-02-20', '14:00:00', 60, 'online', 'https://meet.google.com/cancelled-001', 'cancelled', '2024-02-10 09:00:00'),
(3, 4, 2, 'Python Web Scraping', 'Learn BeautifulSoup and Scrapy for data extraction.', '2024-02-15', '11:00:00', 90, 'online', 'https://meet.google.com/cancelled-002', 'cancelled', '2024-02-05 10:00:00');

-- =====================================================
-- INSERT REVIEWS (Ratings and Feedback for completed sessions)
-- =====================================================

-- Reviews for John (Teacher ID: 2)
INSERT INTO reviews (session_id, reviewer_id, reviewee_id, rating, feedback, tags, created_at) VALUES
(1, 3, 2, 5, 'Excellent teacher! Very clear explanations and great examples. Highly recommended!', '["Excellent teacher","Clear explanations","Patient"]', '2024-03-02 10:00:00'),
(3, 4, 2, 5, 'Best React teacher I have ever had. Learned so much in just one session.', '["Knowledgeable","Helpful","Professional"]', '2024-03-04 11:00:00');

-- Reviews for Jane (Teacher ID: 3)
INSERT INTO reviews (session_id, reviewer_id, reviewee_id, rating, feedback, tags, created_at) VALUES
(2, 2, 3, 5, 'Jane is amazing! Made complex Python concepts easy to understand.', '["Excellent teacher","Clear explanations","Patient"]', '2024-03-03 09:00:00'),
(4, 5, 3, 4, 'Very knowledgeable about data science. Session was informative but could have been more structured.', '["Knowledgeable","Helpful"]', '2024-03-05 14:00:00');

-- Reviews for Mike (Teacher ID: 4)
INSERT INTO reviews (session_id, reviewer_id, reviewee_id, rating, feedback, tags, created_at) VALUES
(5, 2, 4, 5, 'Great UI/UX insights! Mike is very creative and explains design principles well.', '["Excellent teacher","Helpful","Professional"]', '2024-03-06 10:00:00');

-- Reviews for Sarah (Teacher ID: 5)
INSERT INTO reviews (session_id, reviewer_id, reviewee_id, rating, feedback, tags, created_at) VALUES
(6, 3, 5, 4, 'Good overview of digital marketing. Looking forward to more sessions.', '["Knowledgeable","Friendly"]', '2024-03-07 16:00:00');

-- Reviews for Admin (Teacher ID: 1) - Admin teaching sessions
INSERT INTO sessions (teacher_id, student_id, skill_id, title, description, session_date, session_time, duration, mode, meeting_link, status, created_at) VALUES
(1, 2, 13, 'Leadership Skills Development', 'Learn essential leadership and management skills.', '2024-03-10', '10:00:00', 60, 'online', 'https://meet.google.com/admin-001', 'completed', '2024-03-01 08:00:00'),
(1, 3, 12, 'Public Speaking Mastery', 'Overcome fear and become a confident speaker.', '2024-03-12', '14:00:00', 90, 'online', 'https://meet.google.com/admin-002', 'completed', '2024-03-03 09:00:00');

INSERT INTO reviews (session_id, reviewer_id, reviewee_id, rating, feedback, tags, created_at) VALUES
(17, 2, 1, 5, 'Admin is an exceptional leader! Learned valuable management techniques.', '["Excellent teacher","Helpful","Professional"]', '2024-03-11 11:00:00'),
(18, 3, 1, 5, 'Great public speaking session! Very practical tips and exercises.', '["Excellent teacher","Clear explanations","Friendly"]', '2024-03-13 15:00:00');

-- =====================================================
-- INSERT MESSAGES (Chat conversations)
-- =====================================================

-- Conversation between John (2) and Jane (3)
INSERT INTO messages (sender_id, receiver_id, message, is_read, created_at) VALUES
(2, 3, 'Hi Jane! I saw you teach Python. I would love to learn from you!', 1, '2024-03-15 09:00:00'),
(3, 2, 'Hi John! Absolutely. When are you available for a session?', 1, '2024-03-15 09:05:00'),
(2, 3, 'How about this weekend? Saturday at 2 PM?', 1, '2024-03-15 09:10:00'),
(3, 2, 'Perfect! Saturday at 2 PM works for me. I will send you the meeting link.', 0, '2024-03-15 09:12:00');

-- Conversation between Mike (4) and Sarah (5)
INSERT INTO messages (sender_id, receiver_id, message, is_read, created_at) VALUES
(4, 5, 'Hi Sarah, interested in learning digital marketing. Can you help?', 1, '2024-03-16 10:00:00'),
(5, 4, 'Of course! What specific area are you interested in?', 1, '2024-03-16 10:15:00'),
(4, 5, 'Mostly SEO and social media marketing.', 1, '2024-03-16 10:20:00'),
(5, 4, 'Great! I can teach you both. Let me know your availability.', 0, '2024-03-16 10:25:00');

-- Conversation between Ali (6) and John (2)
INSERT INTO messages (sender_id, receiver_id, message, is_read, created_at) VALUES
(6, 2, 'John, I need help with React. Can you teach me?', 1, '2024-03-17 14:00:00'),
(2, 6, 'Sure Ali! What specific topics do you want to cover?', 1, '2024-03-17 14:30:00'),
(6, 2, 'React Hooks and state management.', 0, '2024-03-17 14:35:00');

-- Conversation between Emma (7) and Jane (3)
INSERT INTO messages (sender_id, receiver_id, message, is_read, created_at) VALUES
(7, 3, 'Hi Jane! I want to learn data science for my photography business analytics.', 1, '2024-03-18 11:00:00'),
(3, 7, 'Hi Emma! Interesting application. Yes, I can help you with data analysis basics.', 1, '2024-03-18 11:20:00'),
(7, 3, 'That would be great! When can we start?', 0, '2024-03-18 11:25:00');

-- =====================================================
-- INSERT MATCH REQUESTS
-- =====================================================

-- Pending requests
INSERT INTO match_requests (from_user_id, to_user_id, skill_id, message, status, created_at) VALUES
(4, 2, 3, 'I would love to learn React from you. You have great reviews!', 'pending', '2024-03-19 10:00:00'),
(7, 5, 7, 'Interested in learning digital marketing for my photography business.', 'pending', '2024-03-19 11:30:00'),
(8, 2, 1, 'Need help with JavaScript for my project management dashboard.', 'pending', '2024-03-20 09:15:00'),
(9, 3, 8, 'Want to learn data science to enhance my Excel skills.', 'pending', '2024-03-20 14:00:00');

-- Accepted requests
INSERT INTO match_requests (from_user_id, to_user_id, skill_id, message, status, responded_at, created_at) VALUES
(2, 3, 2, 'Looking forward to learning Python from you!', 'accepted', '2024-03-15 09:30:00', '2024-03-14 10:00:00'),
(3, 2, 1, 'Excited to learn JavaScript from an expert!', 'accepted', '2024-03-16 11:00:00', '2024-03-15 12:00:00'),
(5, 2, 3, 'Would love to learn React for my projects.', 'accepted', '2024-03-17 09:00:00', '2024-03-16 15:00:00');

-- Rejected requests
INSERT INTO match_requests (from_user_id, to_user_id, skill_id, message, status, responded_at, created_at) VALUES
(6, 5, 7, 'Interested in digital marketing', 'rejected', '2024-03-18 10:00:00', '2024-03-17 16:00:00'),
(8, 4, 6, 'Want to learn UI/UX design', 'rejected', '2024-03-19 14:30:00', '2024-03-18 09:00:00');

-- =====================================================
-- INSERT PROGRESS TRACKING
-- =====================================================

INSERT INTO progress_tracking (user_id, skill_id, sessions_completed, proficiency_level, notes) VALUES
(2, 2, 5, 3, 'Making good progress on Python basics'),
(2, 8, 2, 2, 'Completed data science introduction'),
(3, 1, 8, 4, 'Comfortable with JavaScript now'),
(3, 3, 4, 3, 'Learning React gradually'),
(4, 1, 3, 2, 'Still learning JavaScript fundamentals'),
(5, 2, 2, 2, 'Completed Python basics course'),
(6, 3, 2, 2, 'Started learning React components'),
(7, 7, 3, 2, 'Learning marketing basics'),
(8, 12, 1, 1, 'Just started public speaking training'),
(9, 28, 4, 3, 'Good progress on SQL queries'),
(10, 2, 2, 2, 'Learning Python for automation');

-- =====================================================
-- INSERT NOTIFICATIONS
-- =====================================================

INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at) VALUES
(2, 'session_request', 'New Session Request', 'Mike Johnson wants to learn React from you', 'sessions.html', 0, '2024-03-20 10:00:00'),
(2, 'message', 'New Message', 'You have a new message from Ali Asad', 'chat.html', 0, '2024-03-20 09:30:00'),
(3, 'match_request', 'New Connection Request', 'John Doe wants to connect with you', 'matches.html', 1, '2024-03-19 15:00:00'),
(4, 'session_reminder', 'Session Tomorrow', 'Your session with Sarah Wilson is tomorrow at 2 PM', 'sessions.html', 0, '2024-03-20 08:00:00'),
(5, 'review_received', 'New Review', 'Jane Smith left you a 5-star review', 'profile.html', 1, '2024-03-18 12:00:00'),
(6, 'session_accepted', 'Session Accepted', 'John Doe accepted your session request', 'sessions.html', 0, '2024-03-17 14:00:00');

-- =====================================================
-- INSERT REPORTS
-- =====================================================

INSERT INTO reports (reporter_id, reported_user_id, reason, description, status, created_at) VALUES
(5, 8, 'Inappropriate behavior', 'User was rude during the session', 'pending', '2024-03-19 10:00:00'),
(7, 6, 'No-show', 'User did not show up for scheduled session', 'reviewed', '2024-03-18 14:00:00'),
(9, 4, 'Spam messages', 'Received multiple spam messages', 'resolved', '2024-03-17 09:00:00');

-- =====================================================
-- UPDATE USER RATINGS (Based on reviews)
-- =====================================================
UPDATE users SET rating = 4.95 WHERE id = 2;
UPDATE users SET rating = 4.85 WHERE id = 3;
UPDATE users SET rating = 4.70 WHERE id = 4;
UPDATE users SET rating = 4.60 WHERE id = 5;
UPDATE users SET rating = 4.50 WHERE id = 6;
UPDATE users SET rating = 4.40 WHERE id = 7;
UPDATE users SET rating = 4.30 WHERE id = 8;
UPDATE users SET rating = 4.90 WHERE id = 9;
UPDATE users SET rating = 4.80 WHERE id = 10;

-- =====================================================
-- UPDATE USER TOTAL SESSIONS
-- =====================================================
UPDATE users SET total_sessions = 8 WHERE id = 2;
UPDATE users SET total_sessions = 6 WHERE id = 3;
UPDATE users SET total_sessions = 4 WHERE id = 4;
UPDATE users SET total_sessions = 3 WHERE id = 5;
UPDATE users SET total_sessions = 2 WHERE id = 6;
UPDATE users SET total_sessions = 2 WHERE id = 7;
UPDATE users SET total_sessions = 1 WHERE id = 8;
UPDATE users SET total_sessions = 2 WHERE id = 9;
UPDATE users SET total_sessions = 2 WHERE id = 10;

-- =====================================================
-- VERIFY DATA
-- =====================================================
SELECT '=========================================' as '';
SELECT 'DATABASE SETUP COMPLETE!' as status;
SELECT '=========================================' as '';
SELECT 'Total Users:' as '', COUNT(*) as count FROM users;
SELECT 'Total Skills:' as '', COUNT(*) as count FROM skills;
SELECT 'Total User Skills:' as '', COUNT(*) as count FROM user_skills;
SELECT 'Total Sessions:' as '', COUNT(*) as count FROM sessions;
SELECT 'Total Messages:' as '', COUNT(*) as count FROM messages;
SELECT 'Total Reviews:' as '', COUNT(*) as count FROM reviews;
SELECT 'Total Match Requests:' as '', COUNT(*) as count FROM match_requests;
SELECT 'Total Progress Records:' as '', COUNT(*) as count FROM progress_tracking;
SELECT 'Total Notifications:' as '', COUNT(*) as count FROM notifications;
SELECT 'Total Reports:' as '', COUNT(*) as count FROM reports;
SELECT '=========================================' as '';

-- Display summary
SELECT '📊 DATABASE SUMMARY' as '';
SELECT 
    (SELECT COUNT(*) FROM users) as 'Total Users',
    (SELECT COUNT(*) FROM skills) as 'Total Skills',
    (SELECT COUNT(*) FROM sessions) as 'Total Sessions',
    (SELECT COUNT(*) FROM messages) as 'Total Messages',
    (SELECT COUNT(*) FROM reviews) as 'Total Reviews',
    (SELECT ROUND(AVG(rating), 2) FROM users WHERE is_admin = 0) as 'Avg User Rating';