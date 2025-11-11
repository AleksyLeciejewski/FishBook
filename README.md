# Fishbook  
**Et XP-projekt i Node.js / Express / MongoDB**

Fishbook er en social webapp for lystfiskere, hvor brugere kan dele fangster, arrangere fisketure og finde nye fiskeområder.  
Projektet udvikles som led i faget **Systemudviklingsmetoder** med fokus på **Extreme Programming (XP)** – hvor metoden, samarbejdet og processen er i centrum.

---

## Projektmål
Målet er at udvikle et simpelt, men funktionelt softwareprodukt i **Node.js / Express / MongoDB** med **REST API** og **client-server arkitektur**.  
Eksamen vurderer **XP-metoden**, ikke koden – fokus ligger på praksis, samarbejde og refleksion.

---

## Produktidé
Fishbook skal give lystfiskere mulighed for at:
- Oprette profiler og dele fangster med billeder, vægt, art og lokation  
- Oprette og tilmelde sig fisketure (offentlige eller private)  
- Kommentere, sende beskeder og se deltagere på ture  
- Søge efter fiskepladser og se vejrforhold i et område  

Data om vejr hentes fra et eksternt **vejr-API** (f.eks. OpenWeatherMap).

---

## User Stories

### Gæst
- Som gæst vil jeg kunne **oprette mig som bruger** på Fishbook.

### Bruger
- Som bruger vil jeg kunne **oprette opslag** med fangster (billede, vægt, art, lokation).  
- Jeg vil kunne **gemme opslag som kladde**.  
- Jeg vil kunne **oprette fisketure**, som andre kan **tilmelde sig**.  
- Jeg som opretter af turen vil kunne **definere, om turen er privat eller offentlig**.  
- Jeg vil kunne **se fiskevejret** i et område.  
- Jeg vil kunne **søge efter fiskepladser** (gratis/betalende).  
- Jeg vil kunne **kommentere** og **sende beskeder** til andre brugere.  
- Jeg vil kunne **se, hvem der deltager** på fisketure.

### Administrator
- Som admin vil jeg kunne **se alle brugere** og **redigere opslag og ture**.  
- Jeg vil kunne **oprette og ændre** fisketure.

---

## Teknisk setup

**Stack:**
- Backend: Node.js + Express  
- Database: MongoDB Atlas  
- Views: EJS + HTML/CSS/JavaScript  
- Eksternt API: OpenWeatherMap (vejrintegration)  
- Test: Jest + Supertest  
- Versionsstyring: Git + GitHub  

**Projektstruktur:**

/controllers
/models
/routes
/views
/public
app.js


---

## XP-manifest (kort version)

| Element | Beskrivelse |
|----------|--------------|
| **Agile praksisser** | Parprogrammering, TDD (Test Driven Development), Continuous Integration |
| **Definition of Done** | Koden er testet (Jest), reviewet af mindst 1 teammedlem, committed og merged til main |
| **Proces** | Iterationer i korte cyklusser (1 uge) med planlægning, udvikling, test og refleksion |
| **Dokumentation** | Rapport + screenshots af tavler, commits, tests og refleksioner |
| **Rollefordeling** | Én gruppe fungerer som udviklere, den anden som kundeteam (roller roteres i næste cyklus) |

---

## Arbejdsproces

1. **Planning Game**  
   Kunden prioriterer stories → udviklere estimerer → sprintboard oprettes i Trello/GitHub Projects.  
2. **Iteration 1**  
   Simpel opsætning + 1-2 funktioner (fx “opret fangst” og “vis fangster”).  
3. **Iteration 2**  
   Tilføj login, beskeder og vejr-API.  
4. **Iteration 3**  
   Tilføj fisketure, kommentarer og admin-panel.  
5. **Evaluering og refleksion**  
   Hver iteration afsluttes med retrospektiv – hvad virkede, hvad justeres?

---

## Dokumentation
Rapporten indeholder:
- Projektmanifest (XP)  
- Procescyklusser  
- Refleksioner (hvad lærte vi, hvad ændrede vi?)  
- Screenshots af commits, tests og boards  
- Konklusion og evaluering af XP-metoden  

---

## Team Fishbook
- [Alex] – Udvikler
- [Daniel] – Udvikler
- [Theis] – Udvikler
- [Tino] – Udvikler

---

## Deadlines
- **15. december kl. 12.00** – Aflevering af rapport + GitHub-link  
- **17. december** – Demodag og præsentation  

---
