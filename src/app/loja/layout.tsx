
export default function LojaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Aqui podemos adicionar um Navbar específico para a loja no futuro */}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
