export const TEST_USERS = {
  get SUPER_ADMIN() {
    return {
      email: process.env.TEST_SUPER_ADMIN_EMAIL || 'mhalim80@hotmail.com',
      password: process.env.TEST_SUPER_ADMIN_PASSWORD || 'mhalim80@hotmail.com',
    };
  },
  get ADMIN() {
    return {
      email: process.env.TEST_ADMIN_EMAIL || 'testadmin@example.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'testadmin@example.com',
    };
  },
  get MENTOR() {
    return {
      email: process.env.TEST_MENTOR_EMAIL || 'testmentor@example.com',
      password: process.env.TEST_MENTOR_PASSWORD || 'testmentor@example.com',
    };
  },
  get STUDENT() {
    return {
      email: process.env.TEST_STUDENT_EMAIL || 'teststudent@example.com',
      password: process.env.TEST_STUDENT_PASSWORD || 'teststudent@example.com',
    };
  },
};
