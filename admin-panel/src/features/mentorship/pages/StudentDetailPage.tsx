import { AdminHeader } from '@/components/ui/admin-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  useStudentActivity,
  useStudentAttempts,
  useStudentProfile,
  useStudentPurchases,
} from '../hooks/use-student-data';
import {
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  CreditCard,
  History,
  Info,
  LineChart,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const studentId = id || '';

  const { data: profile, isLoading: isProfileLoading } = useStudentProfile(studentId);
  const { data: activity } = useStudentActivity(studentId);
  const { data: purchases } = useStudentPurchases(studentId);
  const { data: attempts } = useStudentAttempts(studentId);

  // Process Metacognition Data (Memoized to prevent redundant calculations)
  const confidenceData = useMemo(
    () =>
      attempts?.reduce(
        (acc: { name: string; value: number }[], attempt) => {
          if (attempt.confidence_rating !== null) {
            const rating = attempt.confidence_rating;
            const existing = acc.find((d) => d.name === rating.toString());
            if (existing) existing.value++;
            else acc.push({ name: rating.toString(), value: 1 });
          }
          return acc;
        },
        [] as { name: string; value: number }[]
      ) || [],
    [attempts]
  );

  const difficultyData = useMemo(
    () =>
      attempts?.reduce(
        (acc: { name: string; value: number }[], attempt) => {
          if (attempt.difficulty_perception !== null) {
            const perception = attempt.difficulty_perception;
            const existing = acc.find((d) => d.name === perception);
            if (existing) existing.value++;
            else acc.push({ name: perception, value: 1 });
          }
          return acc;
        },
        [] as { name: string; value: number }[]
      ) || [],
    [attempts]
  );

  // Pre-process activity map for O(1) lookup in heatmap
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    activity?.forEach((a) => {
      if (a.activity_date) {
        map.set(a.activity_date, a.questions_attempted || 0);
      }
    });
    return map;
  }, [activity]);

  const masteryScore = useMemo(() => {
    if (!attempts || attempts.length === 0) return 0;
    const correct = attempts.filter((a) => a.is_correct).length;
    return Math.round((correct / attempts.length) * 100);
  }, [attempts]);

  if (isProfileLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <Info className="h-12 w-12 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Student Not Found</h2>
        <p className="text-gray-500 mt-2">
          The student profile could not be loaded or doesn't exist.
        </p>
        <Link to="/users" className="mt-4">
          <Button variant="outline">Back to Users</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AdminHeader
        title={profile.full_name || profile.email || 'Student Profile'}
        description={profile.email}
        icon={Award}
        backTo="/users"
      />

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest p-0 h-auto hover:bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <div className="flex items-center gap-3">
            {profile.deleted_at && (
              <Badge variant="destructive" className="font-bold">
                DEACTIVATED
              </Badge>
            )}
            <Badge
              variant="outline"
              className="font-bold uppercase tracking-widest text-indigo-600 border-indigo-100 bg-indigo-50"
            >
              ID: {profile.id.substring(0, 8)}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-2xs font-black uppercase tracking-widest opacity-80">
                  Total Points
                </p>
                <ShoppingBag className="h-4 w-4 opacity-80" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black">{profile.metadata?.points_balance ?? 0}</span>
                <span className="text-xs font-bold mb-1 opacity-80 uppercase tracking-widest">
                  Available
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2 text-gray-400">
                <p className="text-2xs font-black uppercase tracking-widest">Current Streak</p>
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex items-end gap-2 text-gray-900">
                <span className="text-3xl font-black">{profile.metadata?.daily_streak ?? 0}</span>
                <span className="text-xs font-bold mb-1 opacity-50 uppercase tracking-widest">
                  Days
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2 text-gray-400">
                <p className="text-2xs font-black uppercase tracking-widest">Hints Remaining</p>
                <Info className="h-4 w-4" />
              </div>
              <div className="flex items-end gap-2 text-gray-900">
                <span className="text-3xl font-black">{profile.metadata?.hints_balance ?? 0}</span>
                <span className="text-xs font-bold mb-1 opacity-50 uppercase tracking-widest">
                  Hints
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2 text-gray-400">
                <p className="text-2xs font-black uppercase tracking-widest">Mastery Level</p>
                <BarChart3 className="h-4 w-4" />
              </div>
              <div className="flex items-end gap-2 text-gray-900">
                <span className="text-3xl font-black">{masteryScore}%</span>
                <span className="text-xs font-bold mb-1 opacity-50 uppercase tracking-widest">
                  Score
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            <TabsTrigger
              value="overview"
              className="rounded-lg font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-lg font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="metacognition"
              className="rounded-lg font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              Metacognition
            </TabsTrigger>
            <TabsTrigger
              value="purchases"
              className="rounded-lg font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              Purchases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <History className="h-4 w-4 text-indigo-500" />
                    Recent Attempts
                  </CardTitle>
                  <CardDescription>Latest learning interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attempts?.slice(0, 5).map((attempt) => (
                      <div
                        key={attempt.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full',
                              attempt.is_correct
                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                : 'bg-red-500'
                            )}
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              Attempt {attempt.id.substring(0, 4)}
                            </p>
                            <p className="text-2xs font-bold text-gray-400 uppercase tracking-wider">
                              {new Date(attempt.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {attempt.confidence_rating !== null && (
                            <Badge variant="outline" className="text-[10px] bg-white">
                              Conf: {attempt.confidence_rating}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!attempts || attempts.length === 0) && (
                      <p className="text-center text-gray-400 py-8 italic text-sm">
                        No attempts yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-purple-500" />
                    Mastery Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attempts?.slice(0, 10).reverse()}>
                      <XAxis dataKey="created_at" hide />
                      <YAxis hide />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 rounded shadow-lg border border-gray-100">
                                <p className="text-xs font-bold text-gray-900">
                                  {payload[0].payload.is_correct ? 'Correct' : 'Incorrect'}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {new Date(payload[0].payload.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="is_correct">
                        {attempts
                          ?.slice(0, 10)
                          .reverse()
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.is_correct ? '#10B981' : '#EF4444'}
                            />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  User Activity Heatmap
                </CardTitle>
                <CardDescription>Daily interaction frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-28 lg:grid-cols-31 gap-2">
                  {/* Simple heatmap visualization */}
                  {Array.from({ length: 90 }).map((__, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (89 - i));
                    const dateStr = date.toISOString().split('T')[0];
                    const count = activityMap.get(dateStr) || 0;

                    return (
                      <div
                        key={i}
                        className={cn(
                          'h-4 w-4 rounded-sm transition-all duration-300 transform hover:scale-125 hover:z-10 cursor-pointer',
                          count === 0
                            ? 'bg-gray-100'
                            : count < 5
                              ? 'bg-emerald-200'
                              : count < 15
                                ? 'bg-emerald-400'
                                : 'bg-emerald-600 shadow-[0_0_10px_rgba(5,150,105,0.4)]'
                        )}
                        title={`${dateStr}: ${count} questions`}
                      />
                    );
                  })}
                </div>
                <div className="mt-6 flex items-center justify-end gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Less
                  </span>
                  <div className="h-3 w-3 rounded-sm bg-gray-100" />
                  <div className="h-3 w-3 rounded-sm bg-emerald-200" />
                  <div className="h-3 w-3 rounded-sm bg-emerald-400" />
                  <div className="h-3 w-3 rounded-sm bg-emerald-600" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    More
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metacognition" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">
                    Confidence Distribution
                  </CardTitle>
                  <CardDescription>Self-reported confidence level (1-5)</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={confidenceData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {confidenceData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-gray-900">
                      {confidenceData.length > 0
                        ? (
                            confidenceData.reduce(
                              (acc: number, item) => acc + Number(item.name) * item.value,
                              0
                            ) / confidenceData.reduce((acc: number, item) => acc + item.value, 0)
                          ).toFixed(1)
                        : '0'}
                    </span>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                      Avg Conf
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">
                    Difficulty Perception
                  </CardTitle>
                  <CardDescription>How students perceive question difficulty</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={difficultyData}>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700 }}
                      />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {difficultyData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="purchases">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-amber-500" />
                  Purchase History
                </CardTitle>
                <CardDescription>Items bought using study points</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-gray-100">
                      <TableHead className="text-2xs font-black uppercase tracking-widest text-gray-400">
                        Date
                      </TableHead>
                      <TableHead className="text-2xs font-black uppercase tracking-widest text-gray-400">
                        Item
                      </TableHead>
                      <TableHead className="text-2xs font-black uppercase tracking-widest text-gray-400">
                        Cost
                      </TableHead>
                      <TableHead className="text-2xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
                        Type
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases?.map((purchase) => (
                      <TableRow key={purchase.id} className="hover:bg-gray-50/50 border-gray-100">
                        <TableCell className="text-xs font-medium text-gray-500">
                          {purchase.purchased_at
                            ? new Date(purchase.purchased_at).toLocaleDateString()
                            : '—'}
                        </TableCell>
                        <TableCell className="font-bold text-gray-900 text-sm">
                          {purchase.item_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 font-black text-indigo-600">
                            <CreditCard className="h-3 w-3" />
                            {purchase.points_cost}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-2xs font-bold uppercase tracking-widest py-0.5 px-2 bg-white"
                          >
                            Item
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!purchases || purchases.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <div className="flex flex-col items-center">
                            <ShoppingBag className="h-10 w-10 text-gray-100 mb-2" />
                            <p className="text-sm font-bold text-gray-400 italic">
                              No purchases discovered yet.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
