import asyncio, pathlib, sys
from playwright.async_api import async_playwright
HTML = pathlib.Path('docs/index.html').read_text()
THREE = pathlib.Path('test/three.mock.js').read_text()
ORBIT = pathlib.Path('test/orbit.mock.js').read_text()
errors = []
async def run(viewport, name):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport=viewport)
        pg.on('pageerror', lambda e: errors.append(f'[{name}] pageerror: {e}'))
        pg.on('console', lambda m: m.type == 'error' and errors.append(f'[{name}] console: {m.text}'))
        async def route(r):
            u = r.request.url
            if u.startswith('https://finn.test/'): return await r.fulfill(body=HTML, content_type='text/html')
            if u.endswith('three.module.js'): return await r.fulfill(body=THREE, content_type='application/javascript', headers={'Access-Control-Allow-Origin':'*'})
            if '/examples/jsm/' in u: return await r.fulfill(body=ORBIT, content_type='application/javascript', headers={'Access-Control-Allow-Origin':'*'})
            return await r.abort()
        await pg.route('**/*', route)
        await pg.goto('https://finn.test/')
        await pg.wait_for_timeout(800)
        webgl = await pg.evaluate("!!document.querySelector('#canvas-wrap canvas')")
        print(name, 'canvas criado:', webgl, '| erro webgl visível:', await pg.is_visible('#webgl-error'))
        print(' clima:', (await pg.inner_text('#weather')).replace('\n',' '))
        # visão geral
        tiles = await pg.locator('.tile').count(); print(' tiles:', tiles)
        if name == 'mobile':
            await pg.click('#panel-handle'); await pg.click('#panel-handle')
        await pg.click('.tile[data-sel="telhado"]'); await pg.wait_for_timeout(200)
        print(' detalhe:', (await pg.inner_text('.det-h h2')), '|', (await pg.inner_text('.det-val b')))
        await pg.click('[data-back]')
        for id in ['fundacao','caixa','jardim']:
            await pg.click(f'.tile[data-sel="{id}"]'); await pg.click('[data-back]')
        # simulação
        await pg.click('.tabs [data-aba="simular"]')
        await pg.click('[data-cen="corte"]'); await pg.click('[data-cen="aporte"]')
        print(' sim compare:', (await pg.inner_text('.compare')).replace('\n',' '))
        print(' banner visível:', await pg.is_visible('#sim-banner'))
        sl = pg.locator('.sliders input[name="reserva"]')
        await sl.evaluate("(e)=>{e.value=40000;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}")
        await pg.wait_for_timeout(100)
        print(' após slider:', (await pg.inner_text('.compare')).replace('\n',' '))
        print(' toast:', await pg.inner_text('#toast'))
        await pg.click('#btn-qual'); print(' qualidade:', await pg.get_attribute('#btn-qual','data-q'))
        await pg.click('[data-sim-aplicar]')
        # dados
        await pg.click('.tabs [data-aba="dados"]')
        await pg.fill('input[name="rendaAtiva"]', '9.000,50')
        await pg.click('#form-dados button[type=submit]')
        await pg.wait_for_timeout(300)
        print(' renda após salvar:', await pg.evaluate("JSON.parse(localStorage.getItem('finnverse.casa.v1')).dados.rendaAtiva"))
        print(' após salvar:', (await pg.inner_text('.health .score')).replace('\n',' '), '| chip:', await pg.inner_text('#mode-chip'))
        await pg.click('.tabs [data-aba="missoes"]')
        print(' missões:', await pg.inner_text('.tabs ~ #panel-body .chip'))
        for t in ['dia','noite','entardecer']: await pg.click(f'[data-tempo="{t}"]')
        await pg.click('#btn-giro'); await pg.click('#btn-home')
        await pg.reload(); await pg.wait_for_timeout(500)
        print(' persistiu após recarregar:', await pg.inner_text('#mode-chip'))
        await pg.screenshot(path=f'test/{name}.png')
        await b.close()
async def main():
    await run({'width':1366,'height':800}, 'desktop')
    await run({'width':390,'height':844}, 'mobile')
    print('\nERROS:', len(errors)); [print(e) for e in errors]
asyncio.run(main())
