import neo4j from 'neo4j-driver';
import './env.mjs';

const uri = process.env.MEMGRAPH_URI || 'bolt://localhost:7687';
const user = process.env.MEMGRAPH_USER || '';
const password = process.env.MEMGRAPH_PASSWORD || '';

let driver;

try {
  driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  console.log('Memgraph driver initialized');
} catch (error) {
  console.error('Failed to create Memgraph driver:', error);
}

export const getSession = () => {
  if (!driver) {
    throw new Error('Memgraph driver is not initialized');
  }
  return driver.session();
};

export default driver;
