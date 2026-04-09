const db = require('../config/db');

exports.getTasks = async (req, res) => {
    const userId = req.user.userId;
    const { search, sort } = req.query;

    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    let params = [userId];

    if (search) {
        query += ' AND title LIKE ?';
        params.push(`%${search}%`);
    }

    if (sort === 'created_at') {
        query += ' ORDER BY created_at DESC';
    } else {
        query += ' ORDER BY created_at DESC'; // Default sort
    }

    try {
        const [tasks] = await db.execute(query, params);
        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

exports.createTask = async (req, res) => {
    const userId = req.user.userId;
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO tasks (user_id, title) VALUES (?, ?)',
            [userId, title]
        );
        const [newTask] = await db.execute('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
        res.status(201).json(newTask[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};

exports.updateTask = async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    const { title, is_completed } = req.body;

    try {
        // Check ownership
        const [tasks] = await db.execute('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
        if (tasks.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        let updateQuery = 'UPDATE tasks SET';
        let params = [];

        if (title !== undefined) {
            updateQuery += ' title = ?,';
            params.push(title);
        }
        if (is_completed !== undefined) {
            updateQuery += ' is_completed = ?,';
            params.push(is_completed);
        }

        // Remove trailing comma
        updateQuery = updateQuery.slice(0, -1);
        updateQuery += ' WHERE id = ? AND user_id = ?';
        params.push(id, userId);

        await db.execute(updateQuery, params);
        const [updatedTask] = await db.execute('SELECT * FROM tasks WHERE id = ?', [id]);
        res.json(updatedTask[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

exports.deleteTask = async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    try {
        const [result] = await db.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found or unauthorized' });
        }
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
};
