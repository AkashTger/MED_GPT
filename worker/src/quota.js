export class Quota {
  constructor(state) { this.state = state; }
  async fetch(request) {
    const { code, ip, limit, globalLimit } = await request.json();
    const day = new Date().toISOString().slice(0, 10);
    const allowed = await this.state.storage.transaction(async tx => {
      let counts = await tx.get('counts');
      if (!counts || counts.day !== day) counts = { day, total: 0, codes: {}, ips: {} };
      if (counts.total >= globalLimit || (counts.codes[code] || 0) >= limit || (counts.ips[ip] || 0) >= limit) return false;
      counts.total++;
      counts.codes[code] = (counts.codes[code] || 0) + 1;
      counts.ips[ip] = (counts.ips[ip] || 0) + 1;
      await tx.put('counts', counts);
      return true;
    });
    return Response.json({ allowed });
  }
}
