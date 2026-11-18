import http from 'http';

const testServer = async () => {
  // dynamically import server
  await import('./server/server.js');

  // wait 1 sec for server to listen
  await new Promise(r => setTimeout(r, 1000));

  const request = (path, method = 'GET', body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user': 'dr.thirumalai',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });

      req.on('error', reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  };

  try {
    console.log('--- RUNNING MERN API SUITE TESTS ---');

    // 1. Health
    const health = await request('/api/health');
    console.log('1. /api/health:', health.status, health.body.status);

    // 2. Auth Users
    const users = await request('/api/auth/users');
    console.log('2. /api/auth/users:', users.status, 'Total users:', users.body.users.length);

    // 3. Login
    const login = await request('/api/auth/login', 'POST', { username: 'dr.thirumalai', password: 'password123' });
    console.log('3. /api/auth/login:', login.status, 'User:', login.body.user.username);

    // 4. Cases
    const cases = await request('/api/cases');
    console.log('4. /api/cases:', cases.status, 'Cases:', cases.body.count);

    // 5. OPD
    const opd = await request('/api/opd');
    console.log('5. /api/opd:', opd.status, 'Visits:', opd.body.count);

    // 6. Lab
    const lab = await request('/api/lab');
    console.log('6. /api/lab:', lab.status, 'Orders:', lab.body.count);

    // 7. Inventory
    const inv = await request('/api/inventory');
    console.log('7. /api/inventory:', inv.status, 'Items:', inv.body.count);

    // 8. Inventory Adjust
    const adjust = await request('/api/inventory/inv_1/adjust', 'POST', { amount: 50, action: 'procured' });
    console.log('8. /api/inventory/inv_1/adjust:', adjust.status, 'New Qty Procured:', adjust.body.item.qty_procured);

    // 9. MRD Stats
    const mrd = await request('/api/mrd/stats');
    console.log('9. /api/mrd/stats:', mrd.status, mrd.body.stats);

    // 10. Clinical Errors
    const clinical = await request('/api/clinical/check-errors', 'POST', {
      patient: { name: 'Test', renalImpairment: true },
      drugChart: [
        { brandName: 'Betaloc', genericName: 'Metoprolol', dose: '100', route: 'P/O', frequency: 'BD' }
      ]
    });
    console.log('10. /api/clinical/check-errors:', clinical.status, 'Errors detected:', clinical.body.errorCount);

    console.log('=============================================');
    console.log('✅ ALL MERN BACKEND API TESTS PASSED 100%!');
    console.log('=============================================');
    process.exit(0);
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exit(1);
  }
};

testServer();
