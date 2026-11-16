import {test,expect} from '@playwright/test';

test('P1-11: 3D Delta scene is truthful, responsive and coupled to preview decisions',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/welcome/');
  const art=page.locator('#delta-art');
  await art.scrollIntoViewIfNeeded();
  await expect(page.locator('#delta-diorama-canvas')).toBeVisible();
  await expect(art).toHaveAttribute('data-diorama-ready','true',{timeout:20000});
  await expect(art).toHaveAttribute('data-diorama-rendered','true');
  const gpuDraw=await art.evaluate(element=>({
    calls:Number(element.dataset.dioramaDrawCalls),
    triangles:Number(element.dataset.dioramaTriangles),
  }));
  expect(gpuDraw.calls).toBeGreaterThan(10);
  expect(gpuDraw.triangles).toBeGreaterThan(1000);
  await expect(page.locator('.diorama-view-label')).toContainText('NOT SATELLITE IMAGERY');
  await expect.poll(()=>page.locator('#delta-diorama-canvas').evaluate(canvas=>Number(getComputedStyle(canvas).opacity))).toBeGreaterThan(.9);
  const initial=await page.locator('#delta-diorama-canvas').evaluate(canvas=>{
    const style=getComputedStyle(canvas);
    return {width:canvas.width,height:canvas.height,opacity:Number(style.opacity)};
  });
  expect(initial.width).toBeGreaterThan(300);
  expect(initial.height).toBeGreaterThan(200);
  expect(initial.opacity).toBeGreaterThan(.9);
  await art.screenshot({path:'test-results/p1-11-desktop-diorama.png'});

  await page.getByRole('button',{name:/Protect soil/}).click();
  await expect(art).toHaveAttribute('data-mode','soil');
  await expect(art).toHaveAttribute('data-diorama-state',/Living ground cover/);
  await page.getByRole('button',{name:/Ask for evidence/}).click();
  await expect(art).toHaveAttribute('data-diorama-state',/Missing field evidence/);
  await expect(page.locator('#decision-result')).toContainText('NASA DATA UNAVAILABLE IN THIS PREVIEW');
  await expect(page.locator('.decision-primary')).toHaveAttribute('href','../walkthrough/');

  await page.setViewportSize({width:360,height:800});
  await art.scrollIntoViewIfNeeded();
  await expect(art).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  const mobileAnnotations=await art.evaluate(element=>{
    const rect=selector=>element.querySelector(selector).getBoundingClientRect().toJSON();
    const label=element.querySelector('.diorama-view-label');
    return {
      label:rect('.diorama-view-label'),
      compass:rect('.diorama-compass'),
      fiction:rect('.delta-fiction'),
      chapter:rect('.delta-chapter-tag'),
      background:getComputedStyle(label).backgroundColor,
    };
  });
  // Readable against both the animated sun and washed-out evidence mode;
  // never obscure the fiction disclaimer or north arrow on narrow screens.
  expect(mobileAnnotations.background).toMatch(/rgba?\(3, 27, 25, 0\.9\)/);
  expect(mobileAnnotations.label.bottom).toBeLessThan(mobileAnnotations.fiction.top - 5);
  expect(mobileAnnotations.label.right).toBeLessThan(mobileAnnotations.compass.left - 5);
  expect(mobileAnnotations.label.top).toBeGreaterThan(mobileAnnotations.chapter.bottom + 5);
  await art.screenshot({path:'test-results/p1-11-mobile-evidence-diorama.png'});
  await page.getByRole('button',{name:/Share water/}).click();
  await expect(art).toHaveAttribute('data-mode','water');
  await art.screenshot({path:'test-results/p1-11-mobile-diorama.png'});
});

test('P1-11: reduced motion still permits button choices with readable feedback',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/welcome/');
  const art=page.locator('#delta-art');
  await art.scrollIntoViewIfNeeded();
  await page.getByRole('button',{name:/Share water/}).focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:/Protect soil/})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#decision-result')).toContainText('No soil moisture is measured');
  const motion=await page.locator('#delta-diorama-canvas').evaluate(canvas=>getComputedStyle(canvas).transitionDuration);
  expect(motion).toBe('0s');
});
