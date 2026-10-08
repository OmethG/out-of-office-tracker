import { query } from './db';

const toYmd = (v) => (v == null ? null : String(v));

// { Kavee: { joined: "2020-02-09", birthday: "1988-02-16" }, ... }
export async function getProfiles() {
  const { rows } = await query('SELECT name, joined, birthday FROM staff_profiles');
  const out = {};
  for (const r of rows) out[r.name] = { joined: toYmd(r.joined), birthday: toYmd(r.birthday) };
  return out;
}

export async function getProfile(name) {
  const { rows } = await query('SELECT joined, birthday FROM staff_profiles WHERE name = $1', [name]);
  return rows[0] ? { joined: toYmd(rows[0].joined), birthday: toYmd(rows[0].birthday) } : { joined: null, birthday: null };
}

export async function saveProfile(name, { joined, birthday }) {
  await query(
    `INSERT INTO staff_profiles (name, joined, birthday, updated_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (name) DO UPDATE SET joined = EXCLUDED.joined, birthday = EXCLUDED.birthday, updated_at = now()`,
    [name, joined, birthday]
  );
}
