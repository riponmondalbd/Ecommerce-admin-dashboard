async function check() {
  try {
    const res = await fetch('http://localhost:5000/api/brands');
    const data = await res.json();
    console.log("RES DATA KEYS:", Object.keys(data));
    console.log("RES DATA SUCCESS:", data.success);
    console.log("RES DATA DATA TYPE:", typeof data.data, Array.isArray(data.data) ? "array" : "not array");
    if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        console.log("RES DATA DATA KEYS:", Object.keys(data.data));
    }
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

check();
