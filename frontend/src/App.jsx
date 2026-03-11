import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import { knowledgeBase } from './utils/knowledgeBase';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const departments = {
    frontend: 'Frontend Developer',
    backend: 'Backend Developer',
    mobile: 'Mobile Developer',
    design: 'UI/UX Designer',
    qa: 'QA Engineer',
    marketing: 'Marketing Specialist',
    sales: 'Sales Representative'
  };

  const [employees, setEmployees] = useState([]);
  const [buddies, setBuddies] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [chatMessages, setChatMessages] = useState([{ id: 1, text: 'Hi! I\'m your AI onboarding assistant. How can I help you today?', sender: 'ai' }]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (currentUser && !currentUser.isAdmin) {
      const employee = employees.find(emp => emp.email === currentUser.email);
      if (employee) {
        setTasks(employee.tasks);
        setSelectedEmployee(employee);
      }
    }
  }, [currentUser, employees]);

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLogin(true);
    setAuthMode('login');
    setCurrentView('dashboard');
  };

  return (
    <>
      {!currentUser && showLogin && (
        <AuthForm
          authMode={authMode}
          setAuthMode={setAuthMode}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          employees={employees}
          setEmployees={setEmployees}
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          department={department}
          setDepartment={setDepartment}
          departments={departments}
        />
      )}

      {currentUser?.isAdmin && currentView === 'admin' && (
        <AdminDashboard
          employees={employees}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          handleLogout={handleLogout}
          setEmployees={setEmployees}
          buddies={buddies}
          setBuddies={setBuddies}
        />
      )}

      {currentUser && !currentUser.isAdmin && (
        <UserDashboard
          currentUser={currentUser}
          selectedEmployee={selectedEmployee}
          tasks={tasks}
          setTasks={setTasks}
          handleLogout={handleLogout}
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          departments={departments}
          knowledgeBase={knowledgeBase}
        />
      )}
    </>
  );
};

export default App;
