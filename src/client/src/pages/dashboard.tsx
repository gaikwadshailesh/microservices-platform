import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface ServiceHealth {
  uptime: number;
  services: {
    [key: string]: {
      status: string;
      circuitBreaker: string;
      lastChecked: string;
    };
  };
  timestamp: number;
}

interface RequestMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  timestamp: string;
  statusCode: number;
  service: string;
  circuitBreakerState?: string;
}

interface SystemMetric {
  timestamp: string;
  cpu: number;
  memory: {
    total: number;
    free: number;
    used: number;
  };
}

interface Metrics {
  requests: RequestMetric[];
  system: SystemMetric[];
}

export default function DashboardPage() {
  const { data: health, isLoading: healthLoading } = useQuery<ServiceHealth>({
    queryKey: ["/api/health"],
    refetchInterval: 5000,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
    refetchInterval: 5000,
  });

  if (healthLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatMemory = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

  const getCircuitBreakerColor = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return 'text-green-500';
      case 'HALF_OPEN':
        return 'text-yellow-500';
      case 'OPEN':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Service Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {health && Object.entries(health.services).map(([service, status]) => (
          <Card key={service} className={status.status === 'healthy' ? 'border-green-500/20' : 'border-red-500/20'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {service.charAt(0).toUpperCase() + service.slice(1)}
              </CardTitle>
              {status.status === 'healthy' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
              </div>
              <div className={`text-sm ${getCircuitBreakerColor(status.circuitBreaker)}`}>
                Circuit Breaker: {status.circuitBreaker}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* CPU Usage */}
        <Card>
          <CardHeader>
            <CardTitle>CPU Load Average</CardTitle>
            <CardDescription>1 minute load average</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.system || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number) => [value.toFixed(2), "Load"]}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
            <CardDescription>System memory utilization</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.system || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis tickFormatter={formatMemory} />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number) => [formatMemory(value), "Memory"]}
                />
                <Area
                  type="monotone"
                  dataKey="memory.used"
                  name="Used Memory"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* API Response Times */}
      <Card>
        <CardHeader>
          <CardTitle>API Response Times</CardTitle>
          <CardDescription>Response time per endpoint</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics?.requests || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => [`${value}ms`, "Response Time"]}
              />
              <Line
                type="monotone"
                dataKey="responseTime"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}