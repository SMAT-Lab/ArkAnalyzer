void g();
void e();
void d();
void c();
void b();
void a();
void f();

void g()
{
}
void e()
{
    f();
    c();
}
void d() { e(); }
void c() { d(); }
void b()
{
    a();
    c();
}
void a()
{
    b();
}
void f()
{
    c();
    d();
    g();
}

int main() { return 0; }
