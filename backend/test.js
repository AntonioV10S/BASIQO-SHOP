const express = require('express');
const app = express();

app.get('/hola', (req, res) => {
    res.send("¡El servidor está funcionando perfectamente!");
});

app.listen(3000, () => console.log('Servidor de prueba corriendo en puerto 3000'));