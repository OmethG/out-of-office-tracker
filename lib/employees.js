import employees from '../config/employees.json';

// Every staff member shares this password; their username identifies them.
const STAFF_PASSWORD = 'methg@2020';

export function getEmployees() {
  return employees;
}

export function findEmployee(name) {
  return employees.find((e) => e.name === name);
}

// Username for each employee: lowercase name with spaces removed, plus "@methg".
// e.g. "Kavee" -> kavee@methg
export function employeeUsername(name) {
  return name.toLowerCase().replace(/\s+/g, '') + '@methg';
}

export function findEmployeeByUsername(username) {
  const typed = String(username || '').trim().toLowerCase();
  return employees.find((e) => employeeUsername(e.name) === typed) || null;
}

export function findEmployeeByLogin(username, password) {
  if (password !== STAFF_PASSWORD) return null;
  return findEmployeeByUsername(username);
}
