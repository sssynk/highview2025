export const mockStudentData = {
  student_id: 'STU-12345',
  first_name: 'John',
  last_name: 'Doe',
  company: 'Tech Corp',
  created_at: '2024-01-15',
  attendance: [
    {
      session_id: 'SES-001',
      session_name: 'Introduction to React',
      date: '2024-01-20',
      points: 5,
    },
    {
      session_id: 'SES-002',
      session_name: 'State Management',
      date: '2024-01-27',
      points: 5,
    },
    {
      session_id: 'SES-003',
      session_name: 'Advanced Hooks',
      date: '2024-02-03',
      points: 2.5,
    },
    {
      session_id: 'SES-004',
      session_name: 'Testing React Apps',
      date: '2024-02-10',
      points: 5,
    },
    {
      session_id: 'SES-005',
      session_name: 'Performance Optimization',
      date: '2024-02-17',
      points: 0,
    },
  ],
  total_session_points: 17.5,
  total_extra_points: 10,
  total_points: 27.5,
};

export const mockUpcomingSessions: any[] = [
  {
    session_id: 'SES-006',
    name: 'Building Full-Stack Applications',
    date: '2024-02-24',
    description: 'Learn how to build complete full-stack applications with React and Node.js',
    created_at: new Date('2024-01-15'),
  },
  {
    session_id: 'SES-007',
    name: 'Authentication & Security',
    date: '2024-03-02',
    description: 'Implementing secure authentication and authorization in your applications',
    created_at: new Date('2024-01-15'),
  },
  {
    session_id: 'SES-008',
    name: 'Deployment & DevOps',
    date: '2024-03-09',
    description: 'Deploying your applications and setting up CI/CD pipelines',
    created_at: new Date('2024-01-15'),
  },
];

export const mockDisputes: any[] = [
  {
    id: 1,
    student_id: 'STU-12345',
    session_id: 'SES-005',
    session_name: 'Performance Optimization',
    date: '2024-02-17',
    message: 'I was present for the entire session but marked as absent. Please review.',
    status: 'pending',
    created_at: '2024-02-18',
  },
];

export const mockSessionDetails = {
  session_id: 'SES-001',
  name: 'Introduction to React',
  date: '2024-01-20',
  description: 'Learn the fundamentals of React including components, props, and state management.',
  instructors: [
    {
      instructor_id: 'INST-001',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@example.com',
      created_at: '2024-01-01',
    },
    {
      instructor_id: 'INST-002',
      first_name: 'Michael',
      last_name: 'Chen',
      email: 'michael.chen@example.com',
      created_at: '2024-01-01',
    },
  ],
  resources: [
    {
      id: 1,
      session_id: 'SES-001',
      type: 'slide',
      title: 'React Basics - Slides',
      url: 'https://example.com/slides/react-basics.pdf',
      content: 'Complete presentation slides',
    },
    {
      id: 2,
      session_id: 'SES-001',
      type: 'link',
      title: 'Official React Documentation',
      url: 'https://react.dev',
      content: 'Reference documentation from React team',
    },
    {
      id: 3,
      session_id: 'SES-001',
      type: 'note',
      title: 'Key Concepts',
      content: '- Components are the building blocks\n- Props pass data to components\n- State manages dynamic data\n- Events handle user interactions',
    },
    {
      id: 4,
      session_id: 'SES-001',
      type: 'recording',
      title: 'Session Recording',
      url: 'https://example.com/recordings/react-intro.mp4',
      content: 'Full session recording',
    },
  ],
};

export const mockProgressChartData = [
  { date: '2024-01-20', points: 5, cumulative_points: 5 },
  { date: '2024-01-27', points: 5, cumulative_points: 10 },
  { date: '2024-02-03', points: 2.5, cumulative_points: 12.5 },
  { date: '2024-02-10', points: 5, cumulative_points: 17.5 },
  { date: '2024-02-17', points: 0, cumulative_points: 17.5 },
];
