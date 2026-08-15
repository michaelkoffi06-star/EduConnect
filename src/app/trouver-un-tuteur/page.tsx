"use client";

import { useState, useEffect } from "react";
import SiteHeader from "@/components/SiteHeader";

interface Subject {
  id: string;
  name: string;
  slug: string;
}

interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  bio: string;
  status: string;
  photoUrl?: string | null;
  subjects: Subject[];
}

// Numéro WhatsApp d'EduConnect (PLACEHOLDER — remplace par le vrai numéro).
// Toute demande passe par l'équipe EduConnect, jamais directement par l'instructeur.
const ADMIN_WHATSAPP = "2250000000000";

export default function Home() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeInstructor, setActiveInstructor] = useState<Instructor | null>(null);
  const [studentEmail, setStudentEmail] = useState<string>("");
  const [studentMessage, setStudentMessage] = useState<string>("");

  const disciplines = [
    { name: "Tous les instructeurs", slug: "" },
    { name: "Mathématiques", slug: "maths" },
    { name: "Physique-Chimie", slug: "physique-chimie" },
    { name: "SVT", slug: "svt" },
    { name: "Anglais", slug: "anglais" },
    { name: "Français", slug: "francais" },
    { name: "Histoire-Géographie", slug: "histoire-geo" },
    { name: "Philosophie", slug: "philosophie" },
    { name: "Économie", slug: "economie" },
    { name: "Allemand", slug: "allemand" },
    { name: "Espagnol", slug: "espagnol" },
    { name: "Portugais", slug: "portugais" },
    { name: "Informatique", slug: "informatique" },
  ];

  useEffect(() => {
    async function fetchInstructors() {
      setLoading(true);
      try {
        const url = selectedSubject
          ? `/api/instructors?subject=${selectedSubject}`
          : "/api/instructors";
        const res = await fetch(url);
        if (res.ok) setInstructors(await res.json());
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchInstructors();
  }, [selectedSubject]);

  const openModal = (instructor: Instructor) => {
    setActiveInstructor(instructor);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveInstructor(null);
    setStudentEmail("");
    setStudentMessage("");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstructor) return;
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentEmail,
          studentMessage,
          instructorId: activeInstructor.id,
          instructorName: `${activeInstructor.firstName} ${activeInstructor.lastName}`,
        }),
      });
      if (response.ok) {
        alert("Votre demande a été transmise à l'équipe EduConnect !");
        closeModal();
      } else {
        alert("Une erreur est survenue.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getWhatsAppLink = (instructorFullName: string) => {
    const msg = encodeURIComponent(
      `Bonjour EduConnect, je suis intéressé(e) par l'instructeur ${instructorFullName}.`
    );
    return `https://wa.me/${ADMIN_WHATSAPP}?text=${msg}`;
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white font-sans relative overflow-hidden">

      <div className="pointer-events-none fixed -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-[#17335e] opacity-40 blur-[100px] -z-10" />
      <div className="pointer-events-none fixed -bottom-56 -right-56 w-[500px] h-[500px] rounded-full bg-[#c9951a] opacity-20 blur-[100px] -z-10" />

      <SiteHeader active="finder" />

      <section className="bg-gradient-to-r from-[#0a1628] via-[#112240] to-[#0d1f38] py-16 px-4 border-b border-[#2a4a6e]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="bg-[#c9951a]/20 text-[#c9951a] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border border-[#c9951a]/30">
            Soutien Scolaire de Haute Qualité
          </span>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-5xl tracking-tight mt-5 mb-4 text-white">
            Trouvez votre Instructeur Idéal
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Accompagnement personnalisé du collège à la terminale par des encadreurs
            rigoureusement sélectionnés.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 mt-10 relative z-10">
        <div className="bg-[#112240]/60 backdrop-blur-md p-4 rounded-2xl border border-[#2a4a6e]/70 shadow-[0_15px_45px_rgba(0,0,0,.35)] flex flex-wrap gap-2">
          {disciplines.map((dis) => (
            <button
              key={dis.slug === "" ? "all" : dis.slug}
              onClick={() => setSelectedSubject(dis.slug)}
              className={
                selectedSubject === dis.slug
                  ? "px-3 py-1.5 rounded-lg text-xs font-semibold border bg-[#c9951a] text-[#0a1628] border-[#c9951a] shadow-[0_0_16px_rgba(201,149,26,.45)] transition"
                  : "px-3 py-1.5 rounded-lg text-xs font-semibold border bg-transparent text-gray-300 border-[#2a4a6e] hover:border-[#c9951a]/60 hover:text-white transition"
              }
            >
              {dis.name}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-10 relative z-10">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#c9951a] border-t-transparent"></div>
          </div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-16 bg-[#112240]/60 backdrop-blur-md rounded-2xl border border-[#2a4a6e]/70">
            <p className="text-gray-400 text-lg">Aucun instructeur dans cette matière.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instructors.map((instructor, index) => (
              <div
                key={instructor.id}
                style={{ animationDelay: `${index * 60}ms` }}
                className="animate-fade-in-up bg-[#112240]/60 backdrop-blur-md rounded-2xl border border-[#2a4a6e]/70 shadow-[0_15px_45px_rgba(0,0,0,.35)] overflow-hidden flex flex-col transition hover:-translate-y-2 hover:border-[#c9951a]/70"
              >
                <div className="p-5 border-b border-[#2a4a6e]/70 flex items-start justify-between">
                  <div>
                    <h3 className="font-[family-name:var(--font-cinzel)] text-base text-white">
                      {instructor.firstName} {instructor.lastName}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#c9951a]/30 shrink-0">
                    {instructor.photoUrl ? (
                      <img
                        src={instructor.photoUrl}
                        alt={`${instructor.firstName} ${instructor.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#c9951a]/20 text-[#c9951a] flex items-center justify-center font-bold text-sm">
                        {instructor.firstName[0]}
                        {instructor.lastName[0]}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">
                      {instructor.bio || "Aucune biographie renseignée."}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {instructor.subjects.map((sub, idx) => (
                        <span
                          key={sub.id || idx}
                          className="bg-[#c9951a]/10 text-[#c9951a] text-xs px-2.5 py-1 rounded-md font-medium border border-[#c9951a]/30"
                        >
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 mt-auto">
                    <button
                      onClick={() => openModal(instructor)}
                      className="w-full bg-gradient-to-r from-[#c9951a] to-[#d4a820] hover:brightness-110 text-[#0a1628] font-bold py-2.5 rounded-lg text-sm transition shadow-[0_8px_20px_rgba(201,149,26,.3)]"
                    >
                      Choisir cet instructeur
                    </button>

                    
                      href={getWhatsAppLink(`${instructor.firstName} ${instructor.lastName}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={[
                        "w-full border border-emerald-500",
                        "text-emerald-400 font-semibold py-2.5",
                        "rounded-lg text-sm text-center block transition hover:bg-emerald-500/10",
                      ].join(" ")}
                    >
                      Contacter EduConnect sur WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isModalOpen && activeInstructor && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#112240] border border-[#2a4a6e] rounded-2xl max-w-md w-full shadow-[0_15px_45px_rgba(0,0,0,.5)] overflow-hidden">
            <div className="bg-gradient-to-r from-[#c9951a] to-[#d4a820] text-[#0a1628] p-4 flex justify-between items-center">
              <h3 className="font-[family-name:var(--font-cinzel)] text-base">Demande de mise en relation</h3>
              <button onClick={closeModal} className="font-bold text-xl">
                &times;
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <p className="text-sm text-gray-400">
                Instructeur choisi :{" "}
                <strong className="text-white">
                  {activeInstructor.firstName} {activeInstructor.lastName}
                </strong>
                <br />
                <span className="text-xs">
                  Votre demande sera transmise à l&apos;équipe EduConnect, qui fera l&apos;intermédiaire avec l&apos;instructeur.
                </span>
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Votre e-mail
                </label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  className="w-full px-3 py-2.5 bg-[#0a1628] border border-[#2a4a6e] text-white rounded-lg text-sm focus:outline-none focus:border-[#c9951a]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Détails de la demande
                </label>
                <textarea
                  rows={4}
                  required
                  value={studentMessage}
                  onChange={(e) => setStudentMessage(e.target.value)}
                  placeholder="Précisez la classe et vos besoins..."
                  className="w-full px-3 py-2.5 bg-[#0a1628] border border-[#2a4a6e] text-white rounded-lg text-sm focus:outline-none focus:border-[#c9951a] resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#c9951a] to-[#d4a820] hover:brightness-110 text-[#0a1628] font-bold py-2.5 rounded-lg text-sm transition"
              >
                Envoyer la notification
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
