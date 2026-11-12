import {expect,test} from '@playwright/test';

test('default architecture, views, persistence and undo/redo',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('textbox',{name:'Project name'})).toHaveValue('Intelligent Invoice Processing');
  await expect(page.getByText('SAP S/4HANA',{exact:true}).first()).toBeVisible();
  await page.getByRole('button',{name:'AI capability view'}).click();
  await expect(page.getByText('Invoice Assistant',{exact:true}).first()).toBeVisible();
  await page.getByRole('button',{name:'Integration view'}).click();
  const projectName=page.getByRole('textbox',{name:'Project name'});
  await projectName.fill('Architecture Smoke Test');
  await expect(page.getByRole('button',{name:'Undo'})).toBeEnabled();
  await page.getByRole('button',{name:'Undo'}).click();
  await expect(projectName).toHaveValue('Intelligent Invoice Processing');
  await page.getByRole('button',{name:'Redo'}).click();
  await expect(projectName).toHaveValue('Architecture Smoke Test');
  await page.reload();
  await expect(page.getByRole('textbox',{name:'Project name'})).toHaveValue('Architecture Smoke Test');
});

test('template component can be created and edited',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Microsoft Dynamics 365'}).click();
  await expect(page.getByText('Microsoft Dynamics 365',{exact:true}).first()).toBeVisible();
  await page.getByRole('button',{name:'Undo'}).click();
  await expect(page.getByText('Microsoft Dynamics 365',{exact:true})).toHaveCount(1); // catalog template remains
});

test('JSON export contains valid project and modeled capabilities',async({page})=>{
  await page.goto('/');
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'JSON',exact:true}).click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe('architecture-project.json');
  const contents=await (await import('node:fs/promises')).readFile(await download.path(),'utf8');
  const project=JSON.parse(contents);
  expect(project.version).toBe(1);
  expect(project.capabilities.some((c:{kind:string})=>c.kind==='mcp-tool')).toBe(true);
});
