
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  pt: {
    // Auth
    welcomeBack: 'Bem-vindo de volta',
    createAccount: 'Crie sua conta',
    enterCredentials: 'Entre com suas credenciais para acessar sua conta.',
    fillDetails: 'Preencha os dados abaixo para começar.',
    corporateEmail: 'Email Corporativo',
    password: 'Senha',
    forgotPassword: 'Esqueceu a senha?',
    rememberMe: 'Lembrar neste dispositivo',
    accessPlatform: 'Acessar Plataforma',
    createFreeAccount: 'Criar Conta Gratuita',
    orContinueWith: 'Ou continue com',
    noAccount: 'Não tem uma conta?',
    haveAccount: 'Já tem uma conta?',
    register: 'Cadastre-se',
    login: 'Faça login',
    
    // Preload
    welcome: 'Bem-vindo',
    selectTaskMsg: 'Selecione uma tarefa para iniciar ou acesse o painel completo.',
    quickAccess: 'Acesso Rápido a Tarefa',
    actions: 'AÇÕES',
    accessDashboard: 'Acessar Dashboard',
    exitAccount: 'Sair da conta',
    noTasksFound: 'Nenhuma tarefa encontrada',

    // Navbar / General
    search: 'Buscar...',
    searchPlaceholder: 'Buscar tarefas...',
    myProfile: 'Meu Perfil',
    backup: 'Fazer Backup',
    restore: 'Restaurar Backup',
    adminPanel: 'Painel Admin',
    logout: 'Sair',
    settings: 'Configurações',
    filter: 'Filtrar',
    viewBoard: 'Quadro',
    viewList: 'Lista',
    
    // Filters
    all: 'Todas',
    overdue: 'Vencidas',
    today: 'Hoje',
    thisMonth: 'Este Mês',
    doneFilter: 'Concluídas',
    pendingFilter: 'Pendentes',

    // Kanban / Task
    newTask: 'Nova Tarefa',
    dragToDelete: 'Solte para excluir',
    addColumn: 'Adicionar Coluna',
    confirmDelete: 'Excluir?',
    confirmDeleteTaskMsg: 'A tarefa será removida permanentemente.',
    confirmDeleteColumnMsg: 'A coluna e todas as tarefas serão removidas.',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Salvar',
    delete: 'Excluir',
    edit: 'Editar',
    duplicate: 'Duplicar',
    saveAsTemplate: 'Salvar Modelo',
    applyTemplate: 'Aplicar Modelo',
    templatesAvailable: 'Modelos Disponíveis',
    noTemplates: 'Nenhum modelo salvo.',

    // Task Dialog
    taskTitle: 'Título da Tarefa',
    status: 'Status',
    column: 'Coluna',
    priority: 'Prioridade',
    assignedTo: 'Responsável',
    dueDate: 'Data de Vencimento',
    details: 'Detalhes',
    color: 'Cor',
    attachments: 'Anexos',
    addAttachment: 'Adicionar',
    uploading: 'Enviando...',
    
    // Task Properties
    todo: 'Pendente',
    in_progress: 'Iniciada',
    done: 'Concluída',
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    overdueLabel: 'Vencido',

    // Updates/Comments
    updates: 'Atualizações',
    newUpdate: 'Nova Atualização',
    textMode: 'Texto',
    checklistMode: 'Checklist',
    publish: 'Publicar',
    writePlaceholder: 'Escreva uma nota, ata de reunião ou comentário...',
    checklistPlaceholder: '- Tarefa 1\n- Tarefa 2',
    deleteSelected: 'Excluir Selecionados',
    deleteUpdatesMsg: 'Você está prestes a excluir as atualizações selecionadas.',
    noUpdates: 'Nenhum registro ainda',

    // Admin
    totalUsers: 'Total Usuários',
    onlineNow: 'Online Agora',
    growth: 'Crescimento',
    dataVolume: 'Volume Dados',
    userManagement: 'Gerenciamento de Usuários',
    document: 'Documento',
    phone: 'Telefone',
    role: 'Função',
    reset2fa: 'Resetar 2FA Admin',
    refresh: 'Atualizar',
    back: 'Voltar',
    adminConfirmTitle: 'Confirmação de Admin',
    adminConfirmMsg: 'Insira seu código 2FA de administrador para salvar.',
    
    // User Profile
    general: 'Geral',
    security: 'Segurança (2FA)',
    preferences: 'Preferências',
    changePhoto: 'Clique na foto para alterar',
    fullName: 'Nome Completo',
    enable2fa: 'Configurar Agora',
    disable2fa: 'Desativar',
    scanQr: 'Escaneie o QR Code',
    verifyCode: 'Verificar',
    confirmDeletes: 'Confirmar Exclusões',
    confirmDeletesDesc: 'Pedir confirmação antes de excluir itens.',
    language: 'Idioma',

    // Languages
    portuguese: 'Português',
    english: 'Inglês',
    spanish: 'Espanhol'
  },
  en: {
    // Auth
    welcomeBack: 'Welcome back',
    createAccount: 'Create your account',
    enterCredentials: 'Enter your credentials to access your account.',
    fillDetails: 'Fill in the details below to get started.',
    corporateEmail: 'Corporate Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    rememberMe: 'Remember on this device',
    accessPlatform: 'Access Platform',
    createFreeAccount: 'Create Free Account',
    orContinueWith: 'Or continue with',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    register: 'Sign up',
    login: 'Log in',

    // Preload
    welcome: 'Welcome',
    selectTaskMsg: 'Select a task to start or access the full dashboard.',
    quickAccess: 'Quick Task Access',
    actions: 'ACTIONS',
    accessDashboard: 'Access Dashboard',
    exitAccount: 'Sign out',
    noTasksFound: 'No tasks found',

    // Navbar / General
    search: 'Search...',
    searchPlaceholder: 'Search tasks...',
    myProfile: 'My Profile',
    backup: 'Backup Data',
    restore: 'Restore Data',
    adminPanel: 'Admin Panel',
    logout: 'Logout',
    settings: 'Settings',
    filter: 'Filter',
    viewBoard: 'Board',
    viewList: 'List',

    // Filters
    all: 'All',
    overdue: 'Overdue',
    today: 'Today',
    thisMonth: 'This Month',
    doneFilter: 'Done',
    pendingFilter: 'Pending',

    // Kanban / Task
    newTask: 'New Task',
    dragToDelete: 'Drop to delete',
    addColumn: 'Add Column',
    confirmDelete: 'Delete?',
    confirmDeleteTaskMsg: 'This task will be permanently removed.',
    confirmDeleteColumnMsg: 'The column and all tasks will be removed.',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    duplicate: 'Duplicate',
    saveAsTemplate: 'Save Template',
    applyTemplate: 'Apply Template',
    templatesAvailable: 'Available Templates',
    noTemplates: 'No saved templates.',

    // Task Dialog
    taskTitle: 'Task Title',
    status: 'Status',
    column: 'Column',
    priority: 'Priority',
    assignedTo: 'Assigned To',
    dueDate: 'Due Date',
    details: 'Details',
    color: 'Color',
    attachments: 'Attachments',
    addAttachment: 'Add',
    uploading: 'Uploading...',

    // Task Properties
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    overdueLabel: 'Overdue',

    // Updates/Comments
    updates: 'Updates',
    newUpdate: 'New Update',
    textMode: 'Text',
    checklistMode: 'Checklist',
    publish: 'Publish',
    writePlaceholder: 'Write a note, meeting minutes, or comment...',
    checklistPlaceholder: '- Task 1\n- Task 2',
    deleteSelected: 'Delete Selected',
    deleteUpdatesMsg: 'You are about to delete the selected updates.',
    noUpdates: 'No records yet',

    // Admin
    totalUsers: 'Total Users',
    onlineNow: 'Online Now',
    growth: 'Growth',
    dataVolume: 'Data Volume',
    userManagement: 'User Management',
    document: 'Document',
    phone: 'Phone',
    role: 'Role',
    reset2fa: 'Reset Admin 2FA',
    refresh: 'Refresh',
    back: 'Back',
    adminConfirmTitle: 'Admin Confirmation',
    adminConfirmMsg: 'Enter your Admin 2FA code to save.',

    // User Profile
    general: 'General',
    security: 'Security (2FA)',
    preferences: 'Preferences',
    changePhoto: 'Click photo to change',
    fullName: 'Full Name',
    enable2fa: 'Setup Now',
    disable2fa: 'Disable',
    scanQr: 'Scan QR Code',
    verifyCode: 'Verify',
    confirmDeletes: 'Confirm Deletions',
    confirmDeletesDesc: 'Ask for confirmation before deleting items.',
    language: 'Language',

    // Languages
    portuguese: 'Portuguese',
    english: 'English',
    spanish: 'Spanish'
  },
  es: {
    // Auth
    welcomeBack: 'Bienvenido de nuevo',
    createAccount: 'Crea tu cuenta',
    enterCredentials: 'Ingrese sus credenciales para acceder a su cuenta.',
    fillDetails: 'Complete los datos a continuación para comenzar.',
    corporateEmail: 'Correo Corporativo',
    password: 'Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    rememberMe: 'Recordar en este dispositivo',
    accessPlatform: 'Acceder a la Plataforma',
    createFreeAccount: 'Crear Cuenta Gratuita',
    orContinueWith: 'O continuar con',
    noAccount: '¿No tienes una cuenta?',
    haveAccount: '¿Ya tienes una cuenta?',
    register: 'Regístrate',
    login: 'Iniciar sesión',

    // Preload
    welcome: 'Bienvenido',
    selectTaskMsg: 'Seleccione una tarea para comenzar o acceda al panel completo.',
    quickAccess: 'Acceso Rápido a Tarea',
    actions: 'ACCIONES',
    accessDashboard: 'Acceder al Tablero',
    exitAccount: 'Cerrar sesión',
    noTasksFound: 'No se encontraron tareas',

    // Navbar / General
    search: 'Buscar...',
    searchPlaceholder: 'Buscar tareas...',
    myProfile: 'Mi Perfil',
    backup: 'Hacer Copia',
    restore: 'Restaurar',
    adminPanel: 'Panel de Admin',
    logout: 'Salir',
    settings: 'Ajustes',
    filter: 'Filtrar',
    viewBoard: 'Tablero',
    viewList: 'Lista',

    // Filters
    all: 'Todas',
    overdue: 'Vencidas',
    today: 'Hoy',
    thisMonth: 'Este Mes',
    doneFilter: 'Completadas',
    pendingFilter: 'Pendientes',

    // Kanban / Task
    newTask: 'Nueva Tarea',
    dragToDelete: 'Soltar para eliminar',
    addColumn: 'Añadir Columna',
    confirmDelete: '¿Eliminar?',
    confirmDeleteTaskMsg: 'Esta tarea se eliminará permanentemente.',
    confirmDeleteColumnMsg: 'La columna y todas las tareas se eliminarán.',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    duplicate: 'Duplicar',
    saveAsTemplate: 'Guardar Plantilla',
    applyTemplate: 'Aplicar Plantilla',
    templatesAvailable: 'Plantillas Disponibles',
    noTemplates: 'Sin plantillas guardadas.',

    // Task Dialog
    taskTitle: 'Título de la Tarea',
    status: 'Estado',
    column: 'Columna',
    priority: 'Prioridad',
    assignedTo: 'Asignado a',
    dueDate: 'Fecha de Vencimiento',
    details: 'Detalles',
    color: 'Color',
    attachments: 'Adjuntos',
    addAttachment: 'Añadir',
    uploading: 'Subiendo...',

    // Task Properties
    todo: 'Por Hacer',
    in_progress: 'En Progreso',
    done: 'Hecho',
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    overdueLabel: 'Vencido',

    // Updates/Comments
    updates: 'Actualizaciones',
    newUpdate: 'Nueva Actualización',
    textMode: 'Texto',
    checklistMode: 'Lista',
    publish: 'Publicar',
    writePlaceholder: 'Escriba una nota, acta de reunión o comentario...',
    checklistPlaceholder: '- Tarea 1\n- Tarea 2',
    deleteSelected: 'Eliminar Seleccionados',
    deleteUpdatesMsg: 'Está a punto de eliminar las actualizaciones seleccionadas.',
    noUpdates: 'Sin registros aún',

    // Admin
    totalUsers: 'Usuarios Totales',
    onlineNow: 'En Línea',
    growth: 'Crecimiento',
    dataVolume: 'Volumen Datos',
    userManagement: 'Gestión de Usuarios',
    document: 'Documento',
    phone: 'Teléfono',
    role: 'Rol',
    reset2fa: 'Restablecer 2FA Admin',
    refresh: 'Actualizar',
    back: 'Volver',
    adminConfirmTitle: 'Confirmación de Admin',
    adminConfirmMsg: 'Ingrese su código 2FA de administrador para guardar.',

    // User Profile
    general: 'General',
    security: 'Seguridad (2FA)',
    preferences: 'Preferencias',
    changePhoto: 'Clic en foto para cambiar',
    fullName: 'Nombre Completo',
    enable2fa: 'Configurar Ahora',
    disable2fa: 'Desactivar',
    scanQr: 'Escanear código QR',
    verifyCode: 'Verificar',
    confirmDeletes: 'Confirmar Eliminaciones',
    confirmDeletesDesc: 'Pedir confirmación antes de eliminar elementos.',
    language: 'Idioma',

    // Languages
    portuguese: 'Portugués',
    english: 'Inglés',
    spanish: 'Español'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('agiliza_language') || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('agiliza_language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
