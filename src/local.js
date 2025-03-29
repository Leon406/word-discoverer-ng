import { readerService } from './common_lib';
import { initForPage } from './content_script';

document.addEventListener('DOMContentLoaded', function() {
  readerService()
  initForPage()
});
