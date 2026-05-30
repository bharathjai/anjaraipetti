fetch('http://localhost:4000/health')
  .then(res => res.json())
  .then(json => console.log('BACKEND IS RUNNING SUCCESSFULLY:', json))
  .catch(err => console.error('BACKEND IS NOT RUNNING:', err.message));
