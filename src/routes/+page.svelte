<script lang="ts">
  import SiteFooter from "$lib/components/SiteFooter.svelte";
  import LassoMark from "$lib/art/LassoMark.svelte";
  import StepArt from "$lib/art/StepArt.svelte";
  import Icon from "$lib/components/Icon.svelte";

  const steps = [
    { title: "Add your class", text: "Name it and paste in your roster, one student per line." },
    { title: "Pick a view", text: "A grid of initials, or your real room with students at their desks." },
    { title: "Start tapping", text: "Tap a student, tap what they did. The count keeps itself." },
  ];
</script>

<div class="welcome">
  <header class="top">
    <span class="brand wordmark"><LassoMark size={34} /> Tap &amp; Tally</span>
    <span class="spacer"></span>
    <a class="btn btn-primary" href="/setup">Get started →</a>
  </header>

  <main>
    <section class="hero">
      <div class="pitch">
        <p class="eyebrow">Participation, wrangled</p>
        <h1>Wrangle your class's participation.</h1>
        <p class="lede">
          Tap a student, tap what they did. Tap &amp; Tally keeps the count for every student, every
          day, so you can keep teaching.
        </p>
        <div class="row">
          <a class="btn btn-primary btn-big" href="/setup">Get started →</a>
          <a class="btn btn-quiet" href="/settings">Restore a backup</a>
        </div>
        <p class="fine small"><strong>Free.</strong> No account to make. Your students' names never leave this laptop.</p>
      </div>
      <div class="art"><StepArt kind="hero" /></div>
    </section>

    <section class="steps">
      <p class="eyebrow">Ready before the bell</p>
      <h2>Three steps and you're riding.</h2>
      <ol>
        {#each steps as step, i}
          <li class="card">
            <span class="number">{i + 1}</span>
            <h3>{step.title}</h3>
            <p class="muted">{step.text}</p>
          </li>
        {/each}
      </ol>
    </section>

    <section class="private" aria-labelledby="private-heading">
      <span class="shield" aria-hidden="true"><Icon name="shield" size={28} /></span>
      <div>
        <p class="eyebrow">Private by default</p>
        <h2 id="private-heading">Everything stays on your laptop.</h2>
        <p class="muted">
          Your classes, students and taps are saved in this browser, never uploaded anywhere. There's no
          account, no tracking and no ads. Download a backup whenever you like; it's the only copy that
          ever leaves.
        </p>
      </div>
      <a class="btn btn-big" href="/setup">Get started →</a>
    </section>
  </main>

  <div class="foot"><SiteFooter /></div>
</div>

<style>
  .welcome {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .top,
  main {
    width: 100%;
    max-width: 1120px;
    margin: 0 auto;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .top {
    display: flex;
    align-items: center;
    padding-top: 1.1rem;
    padding-bottom: 1.1rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-size: 1.25rem;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    gap: 3rem;
    align-items: center;
    padding: 3rem 0 4rem;
  }

  h1 {
    font-size: clamp(2.4rem, 5vw, 3.6rem);
    line-height: 1.05;
  }

  .lede {
    margin: 1.1rem 0 1.6rem;
    max-width: 32rem;
    font-size: 1.15rem;
    color: var(--muted);
  }

  .fine {
    margin-top: 1rem;
    color: var(--faint);
  }

  .fine strong {
    color: var(--accent);
  }

  .steps {
    padding: 3rem 0 2rem;
    border-top: 1px solid var(--border);
  }

  .steps h2 {
    font-size: 1.9rem;
  }

  .steps ol {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin: 1.5rem 0 0;
    padding: 0;
    list-style: none;
  }

  .number {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    margin-bottom: 0.75rem;
    border-radius: 50%;
    background: var(--accent-wash);
    color: var(--accent);
    font-weight: 800;
  }

  .steps h3 {
    font-size: 1.05rem;
  }

  .steps li p {
    margin: 0;
  }

  .foot {
    margin-top: auto;
    padding-top: 2rem;
  }

  /* Private by default: the same band Happy Hallways and Growing Reader close on. */
  .private {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 1.5rem;
    align-items: center;
    margin: 3rem 0 1rem;
    padding: 2.1rem 2.4rem;
    border: 1px solid #ecd2bd;
    border-radius: 24px;
    background: linear-gradient(135deg, var(--accent-wash), #fdf8f0);
  }

  .private h2 {
    font-size: clamp(1.5rem, 3vw, 2rem);
  }

  .private p.muted {
    max-width: 640px;
    margin: 0;
    line-height: 1.6;
  }

  .shield {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    border-radius: 16px;
    background: #fff;
    color: var(--accent);
    box-shadow: 0 1px 3px rgb(90 58 32 / 0.12);
  }

  @media (max-width: 860px) {
    .hero,
    .steps ol,
    .private {
      grid-template-columns: minmax(0, 1fr);
    }

    .private {
      padding: 1.75rem 1.5rem;
    }

    .hero {
      padding-top: 1.5rem;
    }
  }
</style>
