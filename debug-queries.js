// ==========================================
// SCRIPT DE DEBUG PARA RASTREAR QUERIES
// ==========================================
// Pega este código en la consola del navegador ANTES de hacer F5

// 1. Interceptar todas las fetch requests a Supabase
const originalFetch = window.fetch;
const requestLog = [];

window.fetch = function(...args) {
  const url = typeof args[0] === 'string' ? args[0] : args[0].url;
  
  if (url && url.includes('supabase')) {
    // Extraer tabla de la URL
    const tableMatch = url.match(/from=([^&]+)/);
    const table = tableMatch ? tableMatch[1] : 'unknown';
    
    // Capturar stack trace para saber quién llamó
    const stack = new Error().stack;
    const caller = stack.split('\n')[2]?.trim() || 'unknown';
    
    requestLog.push({
      timestamp: Date.now(),
      table,
      url,
      caller: caller.substring(0, 100) // Limitar longitud
    });
    
    console.log(`🔍 Supabase Query: ${table}`, {
      url: url.substring(0, 150),
      caller: caller.substring(0, 100)
    });
  }
  
  return originalFetch.apply(this, args);
};

// 2. Función para analizar resultados
window.analyzeQueries = function() {
  console.clear();
  
  // Contar por tabla
  const tableCount = requestLog.reduce((acc, req) => {
    acc[req.table] = (acc[req.table] || 0) + 1;
    return acc;
  }, {});
  
  console.log('📊 RESUMEN DE QUERIES POR TABLA:');
  console.table(tableCount);
  
  // Agrupar por tabla y mostrar detalles
  const byTable = requestLog.reduce((acc, req) => {
    if (!acc[req.table]) acc[req.table] = [];
    acc[req.table].push(req);
    return acc;
  }, {});
  
  console.log('\n🔍 DETALLES POR TABLA:');
  Object.entries(byTable).forEach(([table, requests]) => {
    console.group(`📋 ${table} (${requests.length} queries)`);
    requests.forEach((req, i) => {
      console.log(`  ${i + 1}. ${new Date(req.timestamp).toLocaleTimeString()}`, {
        caller: req.caller,
        url: req.url.substring(0, 200)
      });
    });
    console.groupEnd();
  });
  
  // Timeline
  const timeRange = requestLog.length > 0 
    ? requestLog[requestLog.length - 1].timestamp - requestLog[0].timestamp 
    : 0;
  
  console.log(`\n⏱️ TOTAL QUERIES: ${requestLog.length}`);
  console.log(`⏱️ TIEMPO TOTAL: ${timeRange}ms`);
  console.log(`⏱️ PROMEDIO: ${(timeRange / requestLog.length).toFixed(0)}ms por query`);
  
  return {
    total: requestLog.length,
    byTable: tableCount,
    timeline: timeRange,
    details: byTable
  };
};

// 3. Función para resetear
window.resetQueryLog = function() {
  requestLog.length = 0;
  console.clear();
  console.log('✅ Log reseteado. Listo para nueva prueba.');
};

// 4. Función para exportar a JSON
window.exportQueryLog = function() {
  const data = JSON.stringify(requestLog, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `query-log-${Date.now()}.json`;
  a.click();
  console.log('✅ Log exportado');
};

console.log('✅ Debug script cargado!');
console.log('');
console.log('📝 COMANDOS DISPONIBLES:');
console.log('  analyzeQueries()  - Analizar queries capturadas');
console.log('  resetQueryLog()   - Limpiar log para nueva prueba');
console.log('  exportQueryLog()  - Exportar log a JSON');
console.log('');
console.log('🚀 Ahora haz F5 en la aplicación y luego ejecuta: analyzeQueries()');
