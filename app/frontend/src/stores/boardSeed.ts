import type { Task } from '../types/board'

// Datos de prueba mientras el tablero no se conecta al backend (Slice 03, siguiente alcance).
export const SEED_TASKS: readonly Task[] = [
  { id: 't1', status: 'todo', position: 0, title: 'Definir los criterios de aceptación', description: 'Revisar la solución y acordar cuándo se considera terminado cada slice.', dueDate: '2026-11-20', assignee: 'Ana Pérez' },
  { id: 't2', status: 'todo', position: 1, title: 'Diseñar el formulario de tarea', description: 'Campos de título, descripción, fecha de vencimiento y persona asignada.', dueDate: '2026-11-24', assignee: 'Luis Gómez' },
  { id: 't3', status: 'todo', position: 2, title: 'Crear los endpoints de tareas', description: 'Crear, consultar, editar y eliminar, protegidos con el access token de Cognito.', dueDate: '2026-11-27', assignee: 'Carla Ruiz' },
  { id: 't4', status: 'todo', position: 3, title: 'Levantar MongoDB con Docker', description: 'Contenedor local en el puerto 27017 y conexión desde el microservicio.', dueDate: null, assignee: 'Mateo Díaz' },
  { id: 't5', status: 'todo', position: 4, title: 'Validar el token en el backend', description: 'Comprobar firma, emisor, caducidad y client_id con las claves públicas de Cognito.', dueDate: '2026-11-30', assignee: null },
  { id: 't6', status: 'todo', position: 5, title: 'Escribir la guía de arranque', description: 'Pasos para levantar frontend, backend y base de datos de forma coordinada.', dueDate: '2026-12-02', assignee: 'Sofía Vega' },
  { id: 't7', status: 'todo', position: 6, title: 'Revisar accesibilidad del tablero', description: 'Contraste de colores, foco con teclado y etiquetas para lectores de pantalla.', dueDate: null, assignee: 'Ana Pérez' },
  { id: 't14', status: 'todo', position: 7, title: 'Configurar variables de entorno del backend', description: 'Definir el puerto, la cadena de conexión de MongoDB y los datos del User Pool de Cognito.', dueDate: '2026-12-03', assignee: 'Mateo Díaz' },
  { id: 't15', status: 'todo', position: 8, title: 'Crear el modelo de tarea con Mongoose', description: 'Título, descripción, estado, fecha de vencimiento, persona asignada y posición dentro de la columna.', dueDate: '2026-12-04', assignee: 'Carla Ruiz' },
  { id: 't16', status: 'todo', position: 9, title: 'Endpoint para listar tareas', description: 'Devolver las tareas agrupadas por estado y ordenadas por posición.', dueDate: '2026-12-05', assignee: 'Luis Gómez' },
  { id: 't17', status: 'todo', position: 10, title: 'Endpoint para crear una tarea', description: 'La tarea nace con el estado de la columna y se coloca al final de la cola.', dueDate: '2026-12-06', assignee: 'Luis Gómez' },
  { id: 't18', status: 'todo', position: 11, title: 'Endpoint para editar una tarea', description: 'Permitir cambiar título, descripción, estado y fecha de vencimiento desde el formulario.', dueDate: '2026-12-09', assignee: null },
  { id: 't19', status: 'todo', position: 12, title: 'Endpoint para eliminar una tarea', description: 'Eliminar la tarjeta y compactar las posiciones de la columna.', dueDate: '2026-12-10', assignee: 'Sofía Vega' },
  { id: 't20', status: 'todo', position: 13, title: 'Formulario de creación en el tablero', description: 'Botón + en cada columna que abre el formulario con el estado ya seleccionado.', dueDate: '2026-12-11', assignee: 'Ana Pérez' },
  { id: 't21', status: 'todo', position: 14, title: 'Formulario de edición de tarjetas', description: 'Reutilizar el formulario de creación con los datos de la tarjeta cargados.', dueDate: '2026-12-12', assignee: 'Ana Pérez' },
  { id: 't22', status: 'todo', position: 15, title: 'Confirmación antes de eliminar', description: 'Pedir confirmación para evitar borrar una tarjeta por error.', dueDate: null, assignee: 'Carla Ruiz' },
  { id: 't23', status: 'todo', position: 16, title: 'Mensajes de error del tablero', description: 'Mostrar un aviso claro cuando falle una petición al backend y permitir reintentar.', dueDate: '2026-12-13', assignee: 'Mateo Díaz' },
  { id: 't24', status: 'todo', position: 17, title: 'Estado de carga del tablero', description: 'Esqueleto de columnas mientras llegan las tareas desde el backend, para evitar saltos visuales.', dueDate: '2026-12-16', assignee: 'Sofía Vega' },
  { id: 't25', status: 'todo', position: 18, title: 'Pruebas manuales del flujo completo', description: 'Recorrer login, crear, editar, eliminar y logout, anotando cualquier diferencia con la solución.', dueDate: '2026-12-17', assignee: null },
  { id: 't26', status: 'todo', position: 19, title: 'Documentar la API de tareas', description: 'Listar rutas, cuerpos de petición, respuestas y códigos de error con ejemplos.', dueDate: '2026-12-18', assignee: 'Luis Gómez' },
  { id: 't27', status: 'todo', position: 20, title: 'Revisar el rendimiento con muchas tarjetas', description: 'Comprobar que el scroll de cada columna sigue fluido con decenas de tarjetas.', dueDate: null, assignee: 'Ana Pérez' },
  { id: 't28', status: 'todo', position: 21, title: 'Preparar la demostración del Slice 03', description: 'Ensayar el recorrido completo del tablero con datos reales y dejar listo el guion de la demo.', dueDate: '2026-12-19', assignee: 'Sofía Vega' },

  { id: 't8', status: 'in_progress', position: 0, title: 'Conectar el store con el backend', description: 'Cargar las tareas al abrir el tablero y reflejar los cambios al instante.', dueDate: '2026-11-22', assignee: 'Luis Gómez' },
  { id: 't9', status: 'in_progress', position: 1, title: 'Estilos de las tarjetas', description: 'Tarjeta con acento por estado, fecha y avatar de la persona asignada.', dueDate: '2026-11-18', assignee: 'Carla Ruiz' },
  { id: 't10', status: 'in_progress', position: 2, title: 'Modelo de orden dentro de la columna', description: 'Campo de posición con la semántica de añadir al final, listo para el arrastre.', dueDate: '2026-11-25', assignee: 'Mateo Díaz' },

  { id: 't11', status: 'done', position: 0, title: 'Login con Cognito y PKCE', description: 'Authorization Code con PKCE, sesión en MobX y tokens en localStorage.', dueDate: '2026-11-10', assignee: 'Ana Pérez' },
  { id: 't12', status: 'done', position: 1, title: 'Renovación de sesión', description: 'Refresh token programado antes de que venza el access token.', dueDate: '2026-11-12', assignee: 'Luis Gómez' },
  { id: 't13', status: 'done', position: 2, title: 'Logout con Cognito', description: 'Revocar el refresh token y cerrar también la sesión de la Hosted UI.', dueDate: null, assignee: 'Sofía Vega' },
]
