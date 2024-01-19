// server.test.js
const request = require('supertest');
const app = require('./server'); // Import your Express app

describe('API Endpoints', () => {
  // Test GET /api/tasks endpoint
  it('should fetch tasks from the database', async () => {
    const response = await request(app).get('/api/tasks');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0); // Assuming the database is initially empty
  });

  // Test POST /api/tasks endpoint
  it('should add a new task to the database', async () => {
    const newTask = { title: 'Test Task', description: 'Test Description', status: 'To Do' };

    const response = await request(app)
      .post('/api/tasks')
      .send(newTask);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('_id');
    expect(response.body.title).toBe('Test Task');
  });

  // Test PUT /api/tasks/:id endpoint
  it('should update the status of a task', async () => {
    // Assuming you have a task ID to update
    const taskIdToUpdate = '1234567890';

    const response = await request(app)
      .put(`/api/tasks/${taskIdToUpdate}`)
      .send({ status: 'In Progress' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('In Progress');
  });

  // Test DELETE /api/tasks/:id endpoint
  it('should delete a task from the database', async () => {
    // Assuming you have a task ID to delete
    const taskIdToDelete = '1234567890';

    const response = await request(app).delete(`/api/tasks/${taskIdToDelete}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Task deleted successfully');
  });
});
