import fetch from 'node-fetch';
import { getConfig, API_BASE } from './config';

function getAuthHeader(): string {
    const conf = getConfig();
    return `Bearer ${conf.palace_id}`;
}

export async function inviteAgent(agentName: string, permissions: string = 'read') {
    const res = await fetch(`${API_BASE}/api/palace/agents`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': getAuthHeader(),
        },
        body: JSON.stringify({ agent_name: agentName, permissions }),
    });

    if (!res.ok) {
        const err = await res.json() as any;
        console.error('Error:', err.error);
        process.exit(1);
    }

    const data = await res.json() as any;
    const agent = data.agent;
    console.log(`Guest key created for '${agent.agent_name}':`);
    console.log('');
    console.log(`  ${agent.guest_key}`);
    console.log('');
    console.log(`Permissions: ${agent.permissions}`);
    console.log(`Share this key with the agent. They can store it with:`);
    console.log(`  mempalace auth ${agent.guest_key}`);
}

export async function revokeAgent(agentName: string) {
    const res = await fetch(`${API_BASE}/api/palace/agents`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': getAuthHeader(),
        },
        body: JSON.stringify({ agent_name: agentName }),
    });

    if (!res.ok) {
        const err = await res.json() as any;
        console.error('Error:', err.error);
        process.exit(1);
    }

    console.log(`Agent '${agentName}' revoked.`);
}

export async function listAgents() {
    const res = await fetch(`${API_BASE}/api/palace/agents`, {
        headers: { 'Authorization': getAuthHeader() },
    });

    if (!res.ok) {
        const err = await res.json() as any;
        console.error('Error:', err.error);
        process.exit(1);
    }

    const data = await res.json() as any;
    const agents: any[] = data.agents;

    if (!agents || agents.length === 0) {
        console.log('No agents found. Create one with: mempalace invite <agent_name>');
        return;
    }

    console.log(`${'AGENT'.padEnd(30)} ${'PERMISSIONS'.padEnd(12)} ${'STATUS'.padEnd(10)} CREATED`);
    console.log('-'.repeat(75));
    for (const a of agents) {
        const status = a.active ? 'active' : 'revoked';
        const created = new Date(a.created_at).toISOString().split('T')[0];
        console.log(`${a.agent_name.padEnd(30)} ${a.permissions.padEnd(12)} ${status.padEnd(10)} ${created}`);
    }
}
