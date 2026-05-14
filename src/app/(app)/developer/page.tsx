'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Plus, Trash2, RefreshCw, Copy, Eye, EyeOff, Code, ExternalLink,
  ChevronDown, ChevronUp, Globe, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type OAuthApp = {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  redirectUris: string[];
  scopes: string[];
  createdAt: string;
};

const AVAILABLE_SCOPES = [
  { id: 'openid', label: 'openid', desc: 'Identidad básica (requerido)' },
  { id: 'profile', label: 'profile', desc: 'Nombre y perfil' },
  { id: 'email', label: 'email', desc: 'Correo electrónico' },
  { id: 'notes', label: 'notes', desc: 'Notas del usuario' },
];

function SecretDisplay({ secret, label }: { secret: string; label: string }) {
  const [visible, setVisible] = useState(false);

  function copyToClipboard() {
    navigator.clipboard.writeText(secret);
    toast.success('Copiado al portapapeles');
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
        <code className="flex-1 font-mono text-xs truncate">
          {visible ? secret : '•'.repeat(Math.min(secret.length, 48))}
        </code>
        <button onClick={() => setVisible(!visible)} className="text-muted-foreground hover:text-foreground transition-colors">
          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button onClick={copyToClipboard} className="text-muted-foreground hover:text-foreground transition-colors">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function CreateAppForm({ onCreated }: { onCreated: (secret: string, app: OAuthApp) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['openid']);
  const [submitting, setSubmitting] = useState(false);

  function toggleScope(scope: string) {
    if (scope === 'openid') return; // required
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !redirectUri.trim()) {
      toast.error('Nombre y redirect URI son requeridos');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<{ app: OAuthApp; plainSecret: string }>('/oauth/apps', {
        name: name.trim(),
        description: description.trim() || undefined,
        redirectUris: [redirectUri.trim()],
        scopes: selectedScopes,
      });
      onCreated(res.data.plainSecret, res.data.app);
      setName(''); setDescription(''); setRedirectUri('');
      setSelectedScopes(['openid']);
    } catch {
      toast.error('Error al crear la aplicación');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="app-name" className="text-sm">Nombre de la app *</Label>
          <Input id="app-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi aplicación" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="app-desc" className="text-sm">Descripción</Label>
          <Input id="app-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción opcional" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="redirect-uri" className="text-sm">Redirect URI *</Label>
        <Input id="redirect-uri" value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} placeholder="https://miapp.com/auth/callback" />
        <p className="text-xs text-muted-foreground">La URL a la que se redirige tras la autorización</p>
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Permisos (scopes)</Label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleScope(s.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedScopes.includes(s.id)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              } ${s.id === 'openid' ? 'cursor-default' : 'cursor-pointer'}`}
              title={s.desc}
            >
              {selectedScopes.includes(s.id) && <Shield className="h-3 w-3" />}
              {s.label}
              {s.id === 'openid' && <span className="text-[10px] opacity-70">requerido</span>}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? 'Creando...' : 'Crear aplicación'}
      </Button>
    </form>
  );
}

function AppCard({ app, onDeleted }: { app: OAuthApp; onDeleted: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/oauth/apps/${app.id}`),
    onSuccess: () => {
      toast.success('Aplicación eliminada');
      queryClient.invalidateQueries({ queryKey: ['oauth-apps'] });
      onDeleted();
    },
    onError: () => toast.error('Error al eliminar la aplicación'),
  });

  const regenMutation = useMutation({
    mutationFn: () => api.post<{ plainSecret: string }>(`/oauth/apps/${app.id}/regenerate-secret`),
    onSuccess: (res) => {
      setNewSecret(res.data.plainSecret);
      toast.success('Secreto regenerado — guárdalo ahora, no se mostrará de nuevo');
    },
    onError: () => toast.error('Error al regenerar el secreto'),
  });

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Code className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{app.name}</p>
          {app.description && <p className="text-xs text-muted-foreground truncate">{app.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {new Date(app.createdAt).toLocaleDateString('es-ES')}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/60 px-4 py-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Client ID</Label>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                <code className="flex-1 font-mono text-xs truncate">{app.clientId}</code>
                <button onClick={() => copyToClipboard(app.clientId, 'Client ID')} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Redirect URIs</Label>
              {app.redirectUris.map((uri) => (
                <div key={uri} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <code className="flex-1 font-mono text-xs truncate">{uri}</code>
                  <a href={uri} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Scopes</Label>
            <div className="flex flex-wrap gap-1.5">
              {app.scopes.map((s) => (
                <span key={s} className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {newSecret && <SecretDisplay secret={newSecret} label="Nuevo client secret (guárdalo ahora)" />}

          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => regenMutation.mutate()}
              disabled={regenMutation.isPending}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerar secreto
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 ml-auto"
              onClick={() => {
                if (confirm(`¿Eliminar "${app.name}"? Esta acción no se puede deshacer.`)) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeveloperPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newAppSecret, setNewAppSecret] = useState<{ secret: string; appName: string } | null>(null);

  const { data: apps = [], isLoading } = useQuery<OAuthApp[]>({
    queryKey: ['oauth-apps'],
    queryFn: async () => {
      const res = await api.get<OAuthApp[]>('/oauth/apps');
      return res.data;
    },
  });

  function handleCreated(secret: string, app: OAuthApp) {
    setNewAppSecret({ secret, appName: app.name });
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['oauth-apps'] });
  }

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Portal del desarrollador</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registra tus aplicaciones para usar VaultAuth como proveedor OAuth
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Nueva app
        </Button>
      </div>

      {/* One-time secret display */}
      {newAppSecret && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-400">¡Aplicación creada!</CardTitle>
            <CardDescription className="text-xs">
              Guarda el client secret de <strong>{newAppSecret.appName}</strong> ahora — no se mostrará de nuevo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SecretDisplay secret={newAppSecret.secret} label="Client Secret" />
            <Button variant="ghost" size="sm" className="mt-3 text-xs" onClick={() => setNewAppSecret(null)}>
              He guardado el secreto
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create form */}
      {showForm && (
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Nueva aplicación OAuth</CardTitle>
            <CardDescription className="text-xs">
              Registra tu app para obtener client_id y client_secret
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateAppForm onCreated={handleCreated} />
          </CardContent>
        </Card>
      )}

      {/* Apps list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-14 rounded-xl border bg-muted/20 animate-pulse" />)}
          </div>
        ) : apps.length === 0 ? (
          <Card className="border-dashed border-border/60">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Code className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Sin aplicaciones registradas</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Crea tu primera app OAuth para integrar VaultAuth
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Crear primera app
              </Button>
            </CardContent>
          </Card>
        ) : (
          apps.map((app) => (
            <AppCard key={app.id} app={app} onDeleted={() => {}} />
          ))
        )}
      </div>

      {/* Integration guide */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Guía de integración</CardTitle>
          <CardDescription className="text-xs">Cómo usar VaultAuth como proveedor OAuth en tu app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">1. Redirige al usuario</p>
            <pre className="rounded-lg bg-muted/50 p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
{`GET /oauth/authorize
  ?response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=https://tuapp.com/callback
  &scope=openid+profile+email
  &state=RANDOM_STATE
  &code_challenge=PKCE_CHALLENGE
  &code_challenge_method=S256`}
            </pre>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">2. Intercambia el código</p>
            <pre className="rounded-lg bg-muted/50 p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
{`POST /oauth/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "AUTHORIZATION_CODE",
  "redirect_uri": "https://tuapp.com/callback",
  "client_id": "YOUR_CLIENT_ID",
  "code_verifier": "PKCE_VERIFIER"
}`}
            </pre>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">3. Obtén los datos del usuario</p>
            <pre className="rounded-lg bg-muted/50 p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
{`GET /oauth/userinfo
Authorization: Bearer ACCESS_TOKEN`}
            </pre>
          </div>
          <p className="text-xs text-muted-foreground">
            Discovery: <code className="font-mono">{typeof window !== 'undefined' ? window.location.origin.replace(':3001', ':3000') : 'http://localhost:3000'}/.well-known/openid-configuration</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
