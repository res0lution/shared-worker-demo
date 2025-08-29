import './style.css'
import typescriptLogo from './typescript.svg'

import viteLogo from '/vite.svg'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
	<div>
		<img src="${viteLogo}" class="logo" alt="Vite logo" />
		<img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />

		<h1>Vite + TypeScript</h1>

		<div class="card">
			<button id="openAllTabsModal" type="button">Открыть модалку во всех вкладках</button>
		</div>

		<div id="modalOverlay" class="modal-overlay" aria-hidden="true">
			<div class="modal">
				<h2>Shared modal</h2>
				<p>Это модалка, синхронизированная через SharedWorker.</p>
				<div class="card">
					<button id="closeAllTabsModal" type="button">Закрыть модалку во всех вкладках</button>
				</div>
			</div>
		</div>
	</div>
`

// Инициализация shared worker
let port: MessagePort
(function initSharedWorker() {
	const worker = new SharedWorker('shared-worker.js')
	port = worker.port
	port.start()

	// UI-хуки (ищем элементы, если они есть на странице)
	const $log = document.getElementById('log')
	const $form = document.getElementById('form')
	const $input = document.getElementById('input')
	const $openBtn = document.getElementById('openAllTabsModal')
	const $closeBtn = document.getElementById('closeAllTabsModal')
	const $overlay = document.getElementById('modalOverlay')

	function log(line: string) {
		if ($log) {
			const li = document.createElement('li')
			li.textContent = line
			$log.appendChild(li)
		}
		else {
			console.log(line)
		}
	}

	// Приём сообщений от воркера
	port.onmessage = (e: MessageEvent) => {
		const msg = e.data
		switch (msg?.type) {
			case 'hello':
				log(`🧵 Подключено. Ваш clientId: ${msg.clientId}. Клиентов: ${msg.count}`)
				break
			case 'system':
				log(msg.text)
				break
			case 'chat':
				log(`💬 [${msg.from}]: ${msg.text}`)
				break
			case 'modal-open':
				if ($overlay) $overlay.setAttribute('aria-hidden', 'false')
				log('🔔 modal-open')
				break
			case 'modal-close':
				if ($overlay) $overlay.setAttribute('aria-hidden', 'true')
				log('🔕 modal-close')
				break
			case 'echo':
				log(`↩️ echo: ${JSON.stringify(msg.received)}`)
				break
			default:
				log(`(unknown) ${JSON.stringify(msg)}`)
		}
	}

	port.onmessageerror = () => log('⚠️ messageerror')
	// MessagePort doesn't have onerror, errors are handled via message events

	// Отправка сообщений (если есть форма)
	if ($form && $input) {
		$form.addEventListener('submit', (e: Event) => {
			e.preventDefault()
			const inputElement = $input as HTMLInputElement
			const text = inputElement.value.trim()
			if (text) {
				port.postMessage({ type: 'chat', text })
				log(`🏖️ [ME]: ${text}`)
				inputElement.value = ''
				inputElement.focus()
			}
		})
	}

	// Открытие/закрытие модалки во всех вкладках
	if ($openBtn) {
		$openBtn.addEventListener('click', () => {
			port.postMessage({ type: 'modal-open' })
		})
	}
	if ($closeBtn) {
		$closeBtn.addEventListener('click', () => {
			port.postMessage({ type: 'modal-close' })
		})
	}
	if ($overlay) {
		$overlay.addEventListener('click', (ev) => {
			if (ev.target === $overlay) {
				port.postMessage({ type: 'modal-close' })
			}
		})
	}

	// Чистое отключение при закрытии/перезагрузке вкладки
	window.addEventListener('beforeunload', () => {
		try {
			port.postMessage({ type: 'disconnect' })
			port.close()
		}
		catch {}
	})
})()
