document.getElementById("reseña-form").addEventListener("submit", function(event) {
  event.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const calificacion = document.getElementById("calificacion").value;
  const tema = document.getElementById("tema").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const imagenFile = document.getElementById("imagen").files[0];

  if (!nombre || !calificacion || !tema || !descripcion) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  const data = {
    nombre,
    calificacion,
    tema,
    descripcion,
    fecha: new Date()
  };

  if (imagenFile) {
    const storageRef = firebase.storage().ref();
    const imagenRef = storageRef.child(`imagenes/${Date.now()}_${imagenFile.name}`);

    imagenRef.put(imagenFile).then(snapshot => {
      snapshot.ref.getDownloadURL().then(url => {
        data.imagenURL = url;
        guardarEnFirestore(data);
      });
    }).catch(err => {
      alert("Error al subir la imagen");
      console.error(err);
    });
  } else {
    guardarEnFirestore(data);
  }
});

function guardarEnFirestore(resenaData) {
  db.collection("resenas").add(resenaData).then(() => {
    document.getElementById("reseña-form").reset();
    mostrarResenas();
  }).catch(err => {
    alert("Error al guardar la reseña");
    console.error(err);
  });
}

function mostrarResenas() {
  const contenedor = document.getElementById("reseñas-container");
  contenedor.innerHTML = "";

  db.collection("resenas").orderBy("fecha", "desc").get().then(snapshot => {
    snapshot.forEach(doc => {
      const r = doc.data();
      const div = document.createElement("div");
      div.classList.add("reseña-item");
      div.innerHTML = `
        <p><strong>${r.nombre}</strong> - ${r.calificacion}</p>
        <p><em>${r.tema}</em></p>
        <p>${r.descripcion}</p>
        ${r.imagenURL ? `<img src="${r.imagenURL}" alt="Evidencia" class="reseña-img">` : ""}
        <hr>
      `;
      contenedor.appendChild(div);
    });
  });
}

window.onload = mostrarResenas;
