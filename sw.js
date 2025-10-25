// Bermuda Elevators - Service Worker
// Permite que la app funcione offline

const CACHE_NAME = 'bermuda-elevators-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('❌ Error al cachear recursos:', error);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si está en cache, devolverlo
        if (response) {
          console.log('📱 Sirviendo desde cache:', event.request.url);
          return response;
        }
        
        // Si no está en cache, hacer fetch
        return fetch(event.request).then((response) => {
          // Verificar si es una respuesta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clonar la respuesta
          const responseToCache = response.clone();
          
          // Agregar al cache
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // Si falla el fetch, mostrar página offline
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// PUSH API - Manejar notificaciones push
self.addEventListener('push', event => {
  console.log('🔔 Push recibido:', event);
  
  let notificationData = {
    title: 'Bermuda Elevators',
    body: 'Nueva alerta detectada',
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  };

  // Si hay datos en el push
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || 'Bermuda Elevators',
        body: data.body || 'Nueva alerta detectada',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: data.data || {}
      };
    } catch (error) {
      console.log('Error parseando push data:', error);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200],
    data: notificationData.data,
    actions: [
      {
        action: 'open',
        title: 'Abrir App'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// PUSH API - Manejar clicks en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('🔔 Notificación clickeada:', event);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Solo cerrar, no hacer nada más
    console.log('Notificación cerrada por usuario');
  } else {
    // Click en la notificación (no en botones)
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// PUSH API - Manejar cierre de notificaciones
self.addEventListener('notificationclose', event => {
  console.log('🔔 Notificación cerrada:', event);
});

console.log('🚀 Bermuda Elevators Service Worker cargado');
