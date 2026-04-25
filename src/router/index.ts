import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Dashboard' },
  },
  {
    path: '/watches',
    name: 'watch-list',
    component: () => import('@/views/WatchListView.vue'),
    meta: { title: 'Watches' },
  },
  {
    path: '/watches/:traceId',
    name: 'watch-detail',
    component: () => import('@/views/WatchDetailView.vue'),
    meta: { title: 'Watch Detail' },
  },
  {
    path: '/matches',
    name: 'match-verification',
    component: () => import('@/views/MatchVerificationView.vue'),
    meta: { title: 'Match Verification' },
  },
  {
    path: '/matches/:traceId',
    name: 'match-detail',
    component: () => import('@/views/MatchDetailView.vue'),
    meta: { title: 'Match Detail' },
  },
  {
    path: '/traces',
    name: 'trace-list',
    component: () => import('@/views/TraceListView.vue'),
    meta: { title: 'Traces' },
  },
  {
    path: '/traces/:traceId',
    name: 'trace-detail',
    component: () => import('@/views/TraceDetailView.vue'),
    meta: { title: 'Trace Detail' },
  },
  {
    path: '/references',
    name: 'reference-list',
    component: () => import('@/views/ReferenceListView.vue'),
    meta: { title: 'References' },
  },
  {
    path: '/crawl',
    redirect: '/admin/crawl',
  },
  {
    path: '/database',
    name: 'database-browser',
    component: () => import('@/views/DatabaseBrowserView.vue'),
    meta: { title: 'Database Browser' },
  },
  {
    path: '/trading',
    name: 'trading',
    component: () => import('@/views/TradingView.vue'),
    meta: { title: '交易策略' },
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { title: 'Admin' },
    children: [
      { path: '', redirect: '/admin/crawl-status' },
      {
        path: 'crawl-status',
        name: 'crawl-status',
        component: () => import('@/views/CrawlStatusView.vue'),
        meta: { title: 'Crawl Status', adminTab: 'crawl-status' },
      },
      {
        path: 'crawl',
        name: 'admin-crawl',
        component: () => import('@/views/CrawlView.vue'),
        meta: { title: '手动爬取', adminTab: 'crawl' },
      },
      {
        path: 'scheduler',
        name: 'scheduler',
        component: () => import('@/views/SchedulerView.vue'),
        meta: { title: '定时任务', adminTab: 'scheduler' },
      },
      {
        path: 'matcher',
        name: 'matcher',
        component: () => import('@/views/MatcherView.vue'),
        meta: { title: 'Matcher', adminTab: 'matcher' },
      },
      {
        path: 'corvus',
        name: 'corvus',
        component: () => import('@/views/CorvusView.vue'),
        meta: { title: 'Corvus', adminTab: 'corvus' },
      },
      {
        path: 'usage',
        name: 'usage',
        component: () => import('@/views/UsageView.vue'),
        meta: { title: 'Usage', adminTab: 'usage' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '404 Not Found' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || 'Watch Pipeline'} - Watch Pipeline`
  next()
})

export default router
