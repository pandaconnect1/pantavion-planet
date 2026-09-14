# PantaAI Vercel source-recovery evidence — 2026-09-14

Source project: `pantaai` (`prj_ViFBWhpM0mPurIwxsdvKKmjGrNEs`).

Vercel links the project to GitHub repository `pandaconnect1/nextjs-ai-chatbot`, repository id `994952595`, visibility reported by Vercel as `private`. The current GitHub connector cannot resolve that repository, so this file preserves Vercel-side provenance before any cleanup.

Observed deployment:
- deployment: `dpl_EwYtxUjRFHh8rqmsTCeCFRs8gvgm`
- URL: `pantaai-43hqy2qcf-pandaconnect.vercel.app`
- state: `ERROR`
- target: `production`
- branch: `main`
- source commit: `1410fd14343a421974d504d271d7582216975dff`
- commit message: `Initial commit` / created from Vercel new-project flow

Build-log evidence shows Vercel successfully cloned `github.com/pandaconnect1/nextjs-ai-chatbot` at commit `1410fd1`, then installed 688 packages. The dependency set included Next.js, React, Vercel AI SDK components, CodeMirror, Drizzle/Postgres, Redis, authentication and editor/UI dependencies. This proves the private source existed and was cloneable by Vercel at deployment time even though it is not currently readable by the GitHub connector.

Preservation boundary: no secret environment-variable values are recorded here. Do not delete the Vercel project or its Git linkage until the private repository/source is independently recovered.