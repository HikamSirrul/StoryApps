import AboutPresenter from './about-presenter';

export default class AboutPage {
  async render() {
    return `
    <main id="main-content" tabindex="-1">
      <section class="container about-container" role="document" aria-labelledby="aboutPageTitle">
        <h1 id="aboutPageTitle">Tentang StoryApp</h1>
        <p>StoryApp adalah platform berbagi cerita yang memungkinkan setiap orang untuk mengekspresikan pengalaman, ide, atau momen spesial mereka melalui tulisan dan gambar. Kami percaya bahwa setiap cerita memiliki kekuatan untuk menginspirasi dan menghubungkan satu sama lain.</p>

        <section class="about-info">
          <h2>Visi</h2>
          <p>Visi Menjadi platform berbagi cerita terdepan yang menginspirasi, menghubungkan, dan memberdayakan setiap individu untuk menyuarakan pengalaman dan ide mereka secara bebas, aman, dan bermakna.</p>
        </section>

        <section class="about-contact">
          <h2>Hubungi Saya</h2>
          <p>Untuk pertanyaan lebih lanjut atau untuk berbicara langsung dengan saya, Anda bisa menghubungi saya melalui:</p>
          <ul>
            <li><strong>WhatsApp:</strong> <a href="https://wa.me/628882370643" aria-label="Hubungi saya melalui WhatsApp">Klik di sini untuk mengirim pesan</a></li>
            <li><strong>Instagram:</strong> <a href="https://instagram.com/hikamsrl" aria-label="Kunjungi Instagram saya">@hikamsrl</a></li>
          </ul>
        </section>
      </section>
    </main>
    `;
  }

  async afterRender() {
    AboutPresenter.init();
  }
}
