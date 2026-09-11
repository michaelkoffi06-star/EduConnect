"use client";

import { useState, useEffect } from "react";
import SiteHeader from "@/components/SiteHeader";
import ScrollReveal from "@/components/ScrollReveal";

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

const ADMIN_WHATSAPP = "2250758529323";

export default function Home() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeInstructor, setActiveInstructor] = useState<Instructor | null>(null);
  const [studentEmail, setStudentEmail] = useState<string>("");
  const [studentMessage, setStudentMessage] = useState<string>("");
  const [expandedBioId, setExpandedBioId] = useState<string | null>(null);

  const toggleBio = (id: string) => {
    setExpandedBioId((prev) => (prev === id ? null : id));
  };

  const disciplines = [
    { name: "Tous les instructeurs", slug: "" },
    { name: "Mathematiques", slug: "maths" },
    { name: "Physique-Chimie", slug: "physique-chimie" },
    { name: "SVT", slug: "svt" },
    { name: "Anglais", slug: "anglais" },
    { name: "Francais", slug: "francais" },
    { name: "Histoire-Geographie", slug: "histoire-geo" },
    { name: "Philosophie", slug: "philosophie" },
    { name: "Economie", slug: "economie" },
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
        alert("Votre demande a ete transmise a l'equipe EduConnect !");
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
      `Bonjour EduConnect, je suis interesse(e) par l'instructeur ${instructorFullName}.`
    );
    return `https://wa.me/${ADMIN_WHATSAPP}?text=${msg}`;
  };

  return (
    <div className="min-h-screen bg-white text-[#0d1b3e] font-sans">

      <SiteHeader active="finder" />

      <section className="bg-[#faf8f2] border-b border-[#eee6d3] py-16 px-4">
        <ScrollReveal className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="w-8 h-px bg-[#c9951a]" />
            <span className="text-xs font-medium text-[#8a6510] tracking-wide">
              Soutien scolaire de haute qualite
            </span>
            <span className="w-8 h-px bg-[#c9951a]" />
          </div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-5xl tracking-tight mb-4">
            Trouvez votre Instructeur Ideal
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Accompagnement personnalise du college a la terminale par des encadreurs
            rigoureusement selectionnes.
          </p>
        </ScrollReveal>
      </section>

      <div className="sticky top-[57px] z-40 bg-white/90 backdrop-blur-sm border-b border-[#eee6d3]">
        <div className="max-w-7xl mx-auto px-4 py-4 overflow-x-auto">
          <div className="flex gap-2 w-max">
            {disciplines.map((dis) => (
              <button
                key={dis.slug === "" ? "all" : dis.slug}
                onClick={() => setSelectedSubject(dis.slug)}
                className={
                  selectedSubject === dis.slug
                    ? "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap bg-[#0d1b3e] text-white transition"
                    : "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap bg-[#faf8f2] text-gray-600 border border-[#eee6d3] hover:border-[#c9951a]/60 hover:text-[#0d1b3e] transition"
                }
              >
                {dis.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#c9951a] border-t-transparent"></div>
          </div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-16 bg-[#faf8f2] rounded-3xl border border-[#eee6d3]">
            <p className="text-gray-500 text-lg">Aucun instructeur dans cette matiere.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instructors.map((instructor, index) => (
              <ScrollReveal key={instructor.id} delay={Math.min(index * 80, 400)}>
                <div className="bg-white rounded-3xl border border-[#eee6d3] shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#c9951a]/50">
                  <div className="w-full h-80 overflow-hidden bg-[#faf8f2] relative group">
                    {instructor.photoUrl ? (
                      <a href={instructor.photoUrl} target="_blank" rel="noopener noreferrer" title="Voir la photo en grand">
                        <img
                          src={instructor.photoUrl}
                          alt={`${instructor.firstName} ${instructor.lastName}`}
                          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#c9951a] font-bold text-6xl">
                        {instructor.firstName[0]}
                        {instructor.lastName[0]}
                      </div>
                    )}
                  </div>
                  <div className="p-5 border-b border-[#eee6d3]">
                    <h3 className="font-[family-name:var(--font-cinzel)] text-base">
                      {instructor.firstName} {instructor.lastName}
                    </h3>
                  </div>

                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <p className={`text-gray-600 text-sm leading-relaxed mb-1 ${expandedBioId === instructor.id ? "" : "line-clamp-3"}`}>
                        {instructor.bio || "Aucune biographie renseignee."}
                      </p>
                      {instructor.bio && instructor.bio.length > 120 && (
                        <button type="button" onClick={() => toggleBio(instructor.id)} className="text-xs font-semibold text-[#c9951a] hover:underline mb-4 block">
                          {expandedBioId === instructor.id ? "Voir moins" : "Lire plus"}
                        </button>
                      )}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {instructor.subjects.map((sub, idx) => (
                          <span
                            key={sub.id || idx}
                            className="bg-[#c9951a]/10 text-[#8a6510] text-xs px-2.5 py-1 rounded-md font-medium border border-[#c9951a]/30"
                          >
                            {sub.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 mt-auto">
                      <button
                        onClick={() => openModal(instructor)}
                        className="w-full bg-gradient-to-r from-[#c9951a] to-[#d4a820] hover:brightness-105 text-white font-bold py-2.5 rounded-lg text-sm transition"
                      >
                        Choisir cet instructeur
                      </button>

                      <a href={getWhatsAppLink(`${instructor.firstName} ${instructor.lastName}`)} target="_blank" rel="noopener noreferrer" className={["w-full border border-emerald-400", "text-emerald-600 font-semibold py-2.5", "rounded-lg text-sm text-center block transition hover:bg-emerald-50"].join(" ")}>
                        Contacter EduConnect sur WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {isModalOpen && activeInstructor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#eee6d3] rounded-3xl max-w-md w-full shadow-xl overflow-hidden">
            <div className="bg-[#0d1b3e] text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#c9951a] font-semibold">Demande de mise en relation</span>
                <h3 className="font-[family-name:var(--font-cinzel)] text-lg mt-0.5">
                  {activeInstructor.firstName} {activeInstructor.lastName}
                </h3>
              </div>
              <button onClick={closeModal} className="text-2xl leading-none hover:text-[#c9951a] transition">
                &times;
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <p className="text-xs text-gray-500 -mt-1">
                Votre demande sera transmise a l&apos;equipe EduConnect, qui fera l&apos;intermediaire avec l&apos;instructeur.
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Votre e-mail
                </label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 text-[#0d1b3e] rounded-lg text-sm focus:outline-none focus:border-[#c9951a]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Details de la demande
                </label>
                <textarea
                  rows={4}
                  required
                  value={studentMessage}
                  onChange={(e) => setStudentMessage(e.target.value)}
                  placeholder="Precisez la classe et vos besoins..."
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 text-[#0d1b3e] rounded-lg text-sm focus:outline-none focus:border-[#c9951a] resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#c9951a] to-[#d4a820] hover:brightness-105 text-white font-bold py-2.5 rounded-lg text-sm transition"
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
