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
        path: 'signin',
        name: 'sign-in',
        component: () => import('pages/SignInPage.vue')
      },
      {
        path: 'device',
        name: 'device-dashboard',
        component: () => import('pages/DeviceDashboard.vue'),
        props: true
      },
      {
        path: 'device/:deviceId/ai-insights',
        name: 'ai-insights',
        component: () => import('pages/AIRecommendationsPage.vue'),
        props: true
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
