const ProfessorNode = require('../nodes/ProfessorNode');

class WorkflowRunner {
    constructor() {
        this.agents = {
            'Professor': new ProfessorNode(),
            // Thêm các AI khác vào đây (CodeTeacher, RAGEngineer...)
        };
    }

    /**
     * Điều hướng request tới đúng Agent
     */
    async dispatch(agentName, input, context) {
        const agent = this.agents[agentName] || this.agents['Professor']; // Default
        
        console.log(`\n[WorkflowRunner] Điều động Agent: ${agent.name}`);
        const result = await agent.execute(input, context);
        return result;
    }
}

module.exports = new WorkflowRunner();
