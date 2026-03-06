const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/DeviceListPage.vue')
      },
      {
        path: 'device/:deviceId',
        name: 'device-dashboard',
        component: () => import('pages/DeviceDashboard.vue')
      }
    ]
  },

  // Always leave this as last one
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
