(async () => {
  try {
    const fetch = global.fetch || (await import('node-fetch')).default;
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });
    const text = await res.text();
    console.log('STATUS:', res.status);
    try { console.log('BODY:', JSON.parse(text)); } catch (e) { console.log('BODY TEXT:', text); }
  } catch (err) {
    console.error('REQUEST ERROR', err);
  }
})();
