# Course Enrollment and Grade Management System

A Java-based command-line application for managing student enrollments, assigning grades, and tracking overall academic performance. Built with object-oriented programming (OOP) principles for modularity, scalability, and clarity.

---

## 📚 Overview

This project allows university administrators to:
- Add, view, and update student records
- Add and manage courses with capacity limits
- Enroll students into courses
- Assign and calculate grades
- Display total enrolled students across all courses

It demonstrates core OOP concepts such as encapsulation, class abstraction, static methods, and clean separation of responsibilities across classes.

---

## 🧱 Class Structure

### 🔹 `Student` Class
Represents individual student records and manages course enrollments and grade assignments.

- **Attributes**:
  - `name` – Student's full name
  - `id` – Unique student ID
  - `enrolledCourses` – Map of enrolled `Course` objects to assigned grades

- **Key Methods**:
  - `enrollCourse(Course)` – Adds a course if not full
  - `assignGrade(Course, double)` – Assigns grade per course
  - Getters and setters for all fields

---

### 🔹 `Course` Class
Models a course with capacity limits and student tracking.

- **Attributes**:
  - `courseCode`, `courseName`, `maxCapacity`, `currentCapacity`
  - `totalEnrolledStudents` (static) – Tracks total students globally

- **Key Methods**:
  - `incrementEnrolledStudents()` – Increments student count
  - Getters for all fields
  - `getTotalEnrolledStudents()` – Static method for global enrollment

---

### 🔹 `CourseManagement` Class
Handles course management logic using static methods.

- **Attributes**:
  - `courses` – List of all course objects
  - `overallGrades` – Map of `Student` to calculated average grade

- **Key Methods**:
  -