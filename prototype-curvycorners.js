/*

Copyright (c) 2009 Merten Falk (http://www.aequinoctium.org/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/


/* Force caching of bg images in IE6 */
if ( Prototype.Browser.IE ) {
	try {
		document.execCommand( "BackgroundImageCache", false, true );
	}
	catch(e) {};
}

// object that parses border-radius properties for a box

var curvyCnrSpec = Class.create(
	{
		'initialize'	: function( selText ) {
			this.selectorText = selText;
			
			this.props = $H({});
			
			$A([ 'tl', 'tr', 'bl', 'br' ]).each(
				function( c ) {
					this.props.set(
						c,
						$H(
							{
								'radius'	: 0,
								'unit'		: ''
							}
						)
					);
				}.bind( this )
			);
			
			this.antiAlias = true; // default true
		},
		'setCorner'	: function( tb, lr, radius, unit ) {
			// no corner specified
			if ( ! /^(t|b)$/.test( tb ) || ! /^(l|r)$/.test( lr ) ) {
				this.props.each(
					function( pair ) {
						pair.value.set( 'radius', parseInt( radius ) );
						pair.value.set( 'unit', parseInt( unit ) );
					}
				);
			}
			// corner specified
			else {
				var propname = tb + lr;
				this.props.set(
					propname,
					$H(
						{
							'radius'	: parseInt( radius ),
							'unit'		: unit
						}
					)
				);
			}
		},
		/*
			getCorner(propstring)
			where propstring is:
			- 'tR' or 'bR' : returns top or bottom radius.
			- 'tlR', 'trR', 'blR' or 'brR' : returns top/bottom left/right radius.
			- 'tlu', 'tru', 'blr' or 'bru' : returns t/b l/r unit (px, em...)
			- 'tRu' or 'bRu' : returns top/bottom radius+unit
			- 'tlRu', 'trRu', 'blRu', 'brRu' : returns t/b l/r radius+unit
		*/
		'getCorner'	: function( prop ) {
			if ( /^((t|b)(l|r))(R|u)$/.test( prop ) ) {
				
				return this.props.get( RegExp.$1 ).get( RegExp.$4 == 'R' ? 'radius' : 'unit' );
			}
			if ( /^(t|b)(l|r)Ru$/.test( prop ) ) {
				
				return this.props.get( RegExp.$1 + RegExp.$2 ).get( 'radius' ) + this.props.get( RegExp.$1 + RegExp.$2 ).get( 'unit' );
			}
			if ( /^(t|b)R(u)?$/.test( prop ) ) {
				
				var rl = this.props.get( RegExp.$1 + 'l' ).get( 'radius' );
				var rr = this.props.get( RegExp.$1 + 'r' ).get( 'radius' );
				
				return Math.max( rl, rr ) + '' + ( RegExp.$2 ? this.props.get( RegExp.$1 + ( rl > rr ? 'l' : 'r' ) ).get( 'unit' ) : '' );
			}
			throw new Error( 'Don\'t recognize property ' + prop );
		},
		'radiusDiff'	: function( tb ) {
			if ( ! /^(t|b)$/.test( tb ) ) {
				throw new Error("Param must be 't' or 'b'");
			}
			return Math.abs( this.props.get( tb + 'r' ).get( 'radius' ) - this.props.get( tb + 'l' ).get( 'radius' ) );
		},
		'setFrom'	: function( obj ) {
			if ( ! Object.isHash( obj ) && typeof( obj ) != 'object' ) {
				throw new Error( 'First parameter of curvyCnrSpec.setFrom() must be a object or a hash object.' );
			}
			
			if ( ! Object.isHash( obj ) ) {
				obj = $H( obj );
			}
			
			this.props.each(
				function( pair ) {
					pair.value.set( 'unit', 'px' );
				}
			);
			
			$A([ 'tl', 'tr', 'bl', 'br' ]).each(
				function( c ) {
					var inc = obj.get( c );
					
					if ( Object.isNumber( inc ) ) {
						this.props.set(
							c,
							$H(
								{
									'radius'	: inc,
									'unit'		: this.props.get( c ).get( 'unit' )
								}
							)
						);
					}
				}.bind( this )
			);
			
			if ( obj.get( 'antiAlias' ) ) {
				this.antiAlias = obj.get( 'antiAlias' );
			}
		},
		'cloneOn'	: function( box ) {
			if ( this.props.any( function( pair ) { return ( pair.value.get( 'unit' ) && pair.value.get( 'unit' ) != 'px' ); } ) ) {
				var converted = new curvyCnrSpec;
				this.props.each(
					function( pair ) {
						var px_radius;
						if ( pair.value.get( 'unit' ) != 'px' ) {
							var save = box.getStyle( 'left' );
							box.setStyle( { 'left' : pair.value.get( 'radius' ) + pair.value.get( 'unit' ) } );
							px_radius = box.getStyle( 'left' );
							box.setStyle( { 'left' : save } );
						}
						else {
							px_radius = pair.value.get( 'radius' );
						}
						converted.props.set(
							pair.key,
							$H(
								{
									'radius'	: box.getStyle( 'left' ),
									'unit'		: 'px'
								}
							)
						);
					}
				);
				
				converted.antiAlias = this.antiAlias;
				
				return converted;
			}
			else {
				return this;
			}
		},
		'radiusSum'	: function( tb ) {
			if ( ! /^(t|b)$/.test( tb ) ) {
				throw new Error("Param of curvyCnrSpec.radiusSum() must be 't' or 'b'");
			}
			return this.props.get( tb + 'l' ).get( 'radius' ) + this.props.get( tb + 'r' ).get( 'radius' );
		},
		'radiusCount'	: function( tb ) {
			if ( ! /^(t|b)$/.test( tb ) ) {
				throw new Error("Param of curvyCnrSpec.radiusCount() must be 't' or 'b'");
			}
			var count = 0;
			if ( this.props.get( tb + 'l' ).get( 'radius' ) > 0 ) count++;
			if ( this.props.get( tb + 'r' ).get( 'radius' ) > 0 ) count++;
			return count;
		},
		'cornerNames'	: function() {
			return this.props.keys().findAll(
				function( s ) {
					return this.props.get( s ).get( 'radius' ) > 0;
				}.bind( this )
			);
		}
	}
);

var curvyCorners = new function() {
	var redrawList = $A([]);
	var blockRedraw = false;
	
	var initDone = false;
	
	var REQUIRED_PROTOTYPE = '1.6.1';
	
	var ret = $H({});
	
	if ( ! Prototype.Browser.WebKit && ! Prototype.Browser.Gecko ) {
		ret.update(
			{
				'init'	: function() {
					// quit if this function has already been called
					if ( initDone ) {
						return;
					}
					
					initDone = true;
					
					// do stuff
					curvyCorners.scanStyles();
				},
				'scanStyles'	: function() {
					var corner_styles = $A();
					
					$A( document.styleSheets ).each(
						function( stylesheet ) {
							if ( Prototype.Browser.IE ) {
								var rules = $A([]);
								
								if ( stylesheet.imports ) {
									$A( stylesheet.imports ).each(
										function( imp_stylesheet ) {
											rules.push( $A( imp_stylesheet.rules ) );
										}
									);
								}
								
								rules.push( $A( stylesheet.rules ) );
								
								rules.flatten().each(
									function( r ) {
										var stylehash = $H( r.style );
										
										var allR	= stylehash.get( 'webkit-border-radius' ) || stylehash.get( '-webkit-border-radius' ) || null;
										var tr		= stylehash.get( 'webkit-border-top-right-radius' ) || stylehash.get( '-webkit-border-top-right-radius' ) || null;
										var tl		= stylehash.get( 'webkit-border-top-left-radius' ) || stylehash.get( '-webkit-border-top-left-radius' ) || null;
										var br		= stylehash.get( 'webkit-border-bottom-right-radius' ) || stylehash.get( '-webkit-border-bottom-right-radius' ) || null;
										var bl		= stylehash.get( 'webkit-border-bottom-left-radius' ) || stylehash.get( '-webkit-border-bottom-left-radius' ) || null;
										
										if ( allR || tl || tr || br || bl ) {
											var corner = $H(
												{
													'elements'	: $$( r.selectorText )
												}
											);
											
											if ( allR ) {
												corner.set( 'tr', allR );
												corner.set( 'tl', allR );
												corner.set( 'bl', allR );
												corner.set( 'br', allR );
											}
											if ( tr ) {
												corner.set( 'tr', tr );
											}
											if ( tl ) {
												corner.set( 'tl', tl );
											}
											if ( bl ) {
												corner.set( 'bl', bl );
											}
											if ( br ) {
												corner.set( 'br', br );
											}
											
											corner_styles.push( corner );
										}
									}
								);
							}
							else if ( Prototype.Browser.Opera ) {
								if ( /border-((top|bottom)-(left|right)-)?radius/.test( stylesheet.ownerNode.text ) ) {
									var txt = stylesheet.ownerNode.text;
									txt = txt.replace( /^\@charset\s+("[^"]*";|'[^']*';)/m, '' );
									txt = txt.replace( /\/\*[^*]*\*+([^\/][^*]*\*+)*\//mg, '' );
									txt = txt.replace( /\@media[^{}]+screen[^{}]+{((\s*\@import\s+("[^"]+"|'[^']+'|url\(\s*"[^"]+"\s*\)|url\(\s*'[^']+'\s*\)|url\(\s*[^'"]+?\s*\))(.*?);|([^{}~;]+)\{([^{}]*)\})+)\s*}/mg, "$1" );
									txt = txt.replace( /\@media[^{}]+{((\s*\@import\s+("[^"]+"|'[^']+'|url\(\s*"[^"]+"\s*\)|url\(\s*'[^']+'\s*\)|url\(\s*[^'"]+?\s*\))(.*?);|([^{}~;]+)\{([^{}]*)\})+)\s*}/mg, '' );
									txt = txt.replace( /\@import\s+("[^"]+"|'[^']+'|url\(\s*"[^"]+"\s*\)|url\(\s*'[^']+'\s*\)|url\(\s*[^'"]+?\s*\))(.*?);/mg, '');
									
									var ruleRegExp = /([^{}~;]+)\{[^{}]*-webkit-border-((top|bottom)-(left|right)-)?radius[^{}]*\}/;
									var declRegExp = /([^;:]*-webkit-border-((top|bottom)-(left|right)-)?radius[^;:]*):([^;]*);/;
									
									
									$A( txt.match( new RegExp( ruleRegExp.source, "mg" ) ) ).each(
										function( r ) {
											var corner = $H(
												{
													'elements'	: $$( ruleRegExp.exec( r )[1].replace( /^\s*|\s*$/g, '' ) )
												}
											);
											
											$A( r.match( new RegExp( declRegExp.source, "mg" ) ) ).each(
												function( d ) {
													var matches = declRegExp.exec( d );
													
													var val = matches[5].replace( /^\s*|\s*$/g, '' );
													
													if ( val ) {
														if ( ! matches[2] ) {
															corner.set( 'tr', val );
															corner.set( 'tl', val );
															corner.set( 'bl', val );
															corner.set( 'br', val );
														}
														else {
															corner.set( matches[3].charAt(0) + matches[4].charAt(0), val );
														}
													}
												}
											);
											
											corner_styles.push( corner );
										}
									);
								}
							}
						}
					);
					
					var numRegExp = /^[\d.]+(\w+)/;
					var crnRegExp = /^(t|b)(r|l)$/;
					
					corner_styles.collect(
						function( c ) {
							return c.get( 'elements' );
						}
					).flatten().uniq().each(
						function( elem ) {
							
							var settings = new curvyCnrSpec();
							
							corner_styles.findAll(
								function( c ) {
									return c.get( 'elements' ).include( elem );
								}
							).each(
								function( c ) {
									
									$A( [ 'tr', 'tl', 'bl', 'br' ] ).each(
										function( d ) {
											var rad = c.get( d );
											
											if ( ! Object.isUndefined( rad ) ) {
												var matches = crnRegExp.exec( d );
												
												settings.setCorner( matches[1], matches[2], parseInt( rad ), numRegExp.exec( rad )[1] );
											}
										}
									);
								}
							)
							
							curvyCorners.applyCorners( settings, elem );
						}
					);
				}
			}
		);
	}
	
	ret.update(
		{
			/*
				stolen from script.aculo.us
			*/
			'versionCheck'	: function() {
				function convertVersionString( versionString ) {
					var v = versionString.replace( /_.*|\./g, '' );
					v = parseInt( v + '0'.times( 4-v.length ) );
					return versionString.indexOf('_') > -1 ? v-1 : v;
				}
				
				if (
					( typeof Prototype == 'undefined' ) ||
					( typeof Element == 'undefined' ) ||
					( typeof Element.Methods == 'undefined' ) ||
					( convertVersionString( Prototype.Version ) < convertVersionString( REQUIRED_PROTOTYPE ) )
				) {
					throw curvyCorners.newError( 'prototype-curvycorners.js requires the Prototype JavaScript framework >= ' + REQUIRED_PROTOTYPE );
				}
			},
			/*
			Usage:
				
				curvyCorners.applyCorners( settingsObj, cssSelector );
				
				The CSS syntax is identical to prototype's $$() method, so please refer
				to the $$() docs for details:
				http://api.prototypejs.org/dom/dollardollar.html
				
				curvyCorners.applyCorners( settingsObj, [ domObj1[, domObj2[, domObj3[, . . . [, domObjN]]]] ] );
			*/
			'applyCorners'	: function() {
				var settings;
				var boxCol = $A([]);
				
				if ( ! arguments[0] instanceof( curvyCnrSpec ) && ! Object.isHash( arguments[0] ) && typeof( arguments[0] ) != 'object' ) {
					throw curvyCorners.newError( "First parameter of curvyCorners.applyCorners() must be an curvyCnrSpec object or a hash object or an object." );
				}
				
				if ( arguments[0] instanceof( curvyCnrSpec ) ) {
					settings = arguments[0];
					if ( ! settings.selectorText && Object.isString( arguments[1] ) ) {
						settings.selectorText = arguments[1];
					}
				}
				else {
					settings = new curvyCnrSpec( Object.isString( arguments[1] ) ? arguments[1] : '' );
					settings.setFrom( ( ! Object.isHash( arguments[0] ) ) ? $H( arguments[0] ) : arguments[0] );
				}
				
				if ( ! settings.selectorText ) {
					if (
						(
							! Object.isElement( arguments[1] ) &&
							! Object.isString( arguments[1] ) &&
							! Object.isArray( arguments[1] )
						) ||
						(
							Object.isString( arguments[1] ) &&
							arguments[1] == ''
						)
					) {
						throw curvyCorners.newError( 'Second parameter of curvyCorners.applyCorners() must be an Element object, Array object or a CSS selector.' );
					}
					
					if ( Object.isElement( arguments[1] ) ) {
						boxCol.push( arguments[1] );
					}
					else {
						boxCol = $A(arguments[1]);
					}
				}
				else {
					boxCol = $$( settings.selectorText );
				}
			
				// Loop through each argument
				
				boxCol.each(
					function( elem ) {
						elem = $(elem);
						if ( elem.tagName.toUpperCase() == 'DIV' && elem.retrieve( 'isSetBorder' ) != true ) {
							if ( elem.hasClassName( 'curvyRedraw' ) ) {
								redrawList.push(
									$H(
										{
											'nodeId'	: elem.identify(),
											'spec'		: settings,
											'copy'		: elem.clone( false )
										}
									)
								);
							}
							
							var obj = new curvyObject( settings, elem );
							obj.applyCorners();
							
							elem.store( 'isSetBorder', true );
						}
					}
				);
			},
			'redraw'	: function() {
				if ( ! redrawList.length ) {
					throw curvyCorners.newError( 'curvyCorners.redraw() has nothing to redraw.' );
				}
				
				var oldBlockRedraw = blockRedraw;
				blockRedraw = true;
				
				redrawList.each(
					function( o ) {
						if( ! $( o.get( 'nodeId' ) ).visible() ) {
							return; // don't resize hidden boxes
						}
						
						var newChild = o.get( 'copy' ).clone( false );
						
						if ( ! $( o.get( 'nodeId' ) ).ancestors()[0].hasClassName( 'cornerWrapper' ) ) {
							curvyCorners.alert( 'Couldn\'t find cornerWrapper DIV' );
							throw $break;
						}
						
						$( o.get( 'nodeId' ) ).immediateDescendants().each(
							function( elem ) {
								newChild.insert( elem.clone( true ) );
							}
						);
						
						$( o.get( 'nodeId' ) ).ancestors()[0].replace( newChild );
						
						o.set( 'nodeId', newChild.identify() );
						
						var obj = new curvyObject( o.get( 'spec' ), $( o.get( 'nodeId' ) ) );
						obj.applyCorners();
					}
				);
				
				blockRedraw = oldBlockRedraw;
			},
			'getRedrawList'	: function() {
				return redrawList;
			},
			'setRedrawList'	: function( list ) {
				redrawList = list;
			},
// 			'adjust'	: function( obj, styleKey, styleValue ) {
// 				if ( ! redrawList ) {
// 					throw curvyCorners.newError( 'curvyCorners.adjust() has nothing to adjust.' );
// 				}
// 				else {
// 					var stob = $H();
// 					stob.set( styleKey, styleValue );
// 					
// 					redrawList.each(
// 						function( el ) {
// 							if ( obj === $( el.get( 'nodeId' ) ) ) {
// 								var new_el = el.get( 'copy' ).clone( false );
// 								
// 								new_el.setStyle( stob.toObject() );
// 								el.set(
// 									'copy',
// 									new_el
// 								);
// 							}
// 						}
// 					);
// 				}
// 			},
			'handleWinResize'	: function() {
				if ( ! blockRedraw ) {
					curvyCorners.redraw();
				}
			},
			'setWinResize'	: function( onoff ) {
				blockRedraw = onoff ? false : true;
			},
			'newError'	: function( msg ) {
				return new Error( "curvyCorners Error:\n" + msg );
			},
			'alert'	: function( msg ) {
				if ( typeof curvyCornersVerbose === 'undefined' || curvyCornersVerbose ) {
					alert( msg );
				}
			}
		}
	);
	
	return ret.toObject();
}

// curvyCorners object (can be called directly)

var curvyObject = Class.create(
	{
		'initialize'	: function( settings, box ) {
			this.box	= box;
			this.settings	= settings;
			
			if ( this.settings instanceof( curvyCnrSpec ) )
				// convert non-pixel units
				this.spec = this.settings.cloneOn( this.box );
			else {
				this.spec = new curvyCnrSpec('');
				// no need for unit conversion, use settings param. directly
				this.spec.setFrom( this.settings );
			}
			
			this.css = $H({});
			
			$A([
				'borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth',
				'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
				'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
				'top', 'bottom', 'left', 'right'
			]).each(
				function( s ) {
					var val = this.box.getStyle( s );
					if ( Object.isNumber( val ) ) {
						this.css.set( s, val );
					}
					else if ( Object.isUndefined( val ) || val == null ) {
						this.css.set( s, 0 );
					}
					else if ( ! Object.isString( val ) ) {
						throw new Error('Unexpected style type: '+ s + ': ' + val );
					}
					else {
						var matches = /^[-\d.]([a-z]+)$/.exec( val );
						
						if ( matches && matches[1] != 'px' ) {
							throw new Error( 'Unexpected unit: '+ s + ': ' + val );
						}
						val = parseInt( val );
						if ( ! Object.isNumber( val ) ) {
							val = 0;
						}
						this.css.set( s, val );
					}
				}.bind( this )
			);
			
			this.css.update( this.box.getDimensions() );

			$A([ 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'backgroundColor' ]).each(
				function( s ) {
 					this.css.set( s, curvyUtils.formatColor( this.box.getStyle( s ) || '' ) );
				}.bind( this )
			);
			
			$A([ 'backgroundImage', 'backgroundRepeat', 'position' ]).each(
				function( s ) {
					var val = this.box.getStyle( s );
					if ( s == 'backgroundImage' ) {
						val = ( val != 'none' ) ? val : '';
					}
					this.css.set( s, val || '' );
				}.bind( this )
			);
			
			this.css.set( 'opacity', this.box.getOpacity() );
			
			var bpx = this.box.getStyle( 'backgroundPositionX' ) || '';
			var bpy = this.box.getStyle( 'backgroundPositionY' ) || '';
			
			if ( ! bpx.length && ! bpy.length ) {
				var matches = /^([^ ]+)( +([^ ]+))?$/.exec( this.box.getStyle( 'backgroundPosition' ) || '' );
				
				bpx = matches ? matches[1] : '';
				bpy = ( matches && matches[3] ) ? matches[3] : bpx;
			}
			
			if ( ! bpx.length ) {
				bpx = '0%';
			}
			
			if ( ! bpy.length ) {
				bpy = '0%';
			}
			
			if ( Prototype.Browser.Opera ) {
				bpx = parseInt( bpx );
				if ( ! Object.isNumber( bpx ) ) {
					bpx = '0%';
				}
				var tx = this.css.get( 'width' );
				if ( bpx > tx )	{
					bpx = '100%';
				}
				else {
					bpx = ( tx / bpx * 100 ) + '%'; // convert to percentage
				}
				
				bpy = parseInt( bpy );
				if ( ! Object.isNumber( bpy ) ) {
					bpy = '0%';
				}
				var ty = this.css.get( 'height' );
				if ( bpy > ty )	{
					bpy = '100%';
				}
				else {
					bpy = ( ty / bpy * 100 ) + '%'; // convert to percentage
				}
			}
			
			this.css.set( 'backgroundPositionX', bpx );
			this.css.set( 'backgroundPositionY', bpy );
			
			this.topMaxRadius = this.spec.getCorner('tR');
			this.botMaxRadius = this.spec.getCorner('bR');
			
			var styles = $H(
				{
					'position'		: this.css.get( 'position' ),
					'padding'		: '0px',
					'backgroundColor'	: 'transparent'
				}
			);
			
			$w('width height top bottom left right marginTop marginBottom marginLeft marginRight').each(
				function( b ) {
					var n = this.css.get( b );
					
					if ( n ) {
						styles.set( b, n + 'px' );
					}
				}.bind( this )
			);
			
			this.wrapper = this.box.wrap( 'div' ).setStyle( styles.toObject() );
			
			var btw = this.css.get( 'borderTopWidth' );
			var bbw = this.css.get( 'borderBottomWidth' );
			
			var new_pt = Math.max( this.css.get( 'paddingTop' ) - this.topMaxRadius + btw, 0 );
			var new_pb = Math.max( this.css.get( 'paddingBottom' ) - this.botMaxRadius + bbw, 0 );
			
			styles = $H(
				{
					'position'	: 'absolute',
					'height'	: Math.max( ( this.css.get( 'height' ) ) - this.topMaxRadius - this.botMaxRadius - ( curvyUtils.isQuirksMode() ? 0 : ( new_pt + new_pb ) ), 0 ) + 'px',
					'paddingTop'	: new_pt + 'px',
					'paddingBottom'	: new_pb + 'px',
					'margin'	: '0px',
					'top'		: this.topMaxRadius + 'px',
					'left'		: '0px',
					'right'		: '0px',
					'bottom'	: this.botMaxRadius + 'px'
				}
			);
			
			if ( this.topMaxRadius > 0 && btw > 0 ) {
				styles.set( 'borderTop', 'none' );
				
				if ( this.topMaxRadius < btw ) {
					if ( ! curvyUtils.isQuirksMode() ) {
						styles.set(
							'height',
							(
								parseInt( styles.get( 'height' ) ) -
								( btw - this.topMaxRadius )
							) + 'px'
						);
					}
					styles.set( 'borderTop', ( btw - this.topMaxRadius ) + 'px solid ' + this.css.get( 'borderTopColor' ) );
				}
			}
			
			if ( this.botMaxRadius > 0 && bbw > 0 ) {
				styles.set( 'borderBottom', 'none' );
				
				if ( this.botMaxRadius < bbw ) {
					if ( ! curvyUtils.isQuirksMode() ) {
						styles.set(
							'height',
							(
								parseInt( styles.get( 'height' ) ) -
								( bbw - this.botMaxRadius )
							) + 'px'
						);
					}
					styles.set( 'borderBottom', ( bbw - this.botMaxRadius ) + 'px solid ' + this.css.get( 'borderBottomColor' ) );
				}
				
				this.box.setStyle( styles.toObject() );
			}

			this.box.setStyle( styles.toObject() );
			
			var bi = this.css.get( 'backgroundImage' );
			
			if (
				bi.length &&
				(
					parseInt( this.css.get( 'backgroundPositionX' ) ) !== 0 ||
					parseInt( this.css.get( 'backgroundPositionY' ) ) !== 0
				)
			) {
				var matches = /url\(\s*(["'])?([^'"]+)\1\s*\)/.exec( bi );
				
				this.backgroundObject = new Image;
				this.backgroundObject.src = matches ? matches[2] : bi;
			}
		},
		/*
			This method creates the corners and
			applies them to the div element.
		*/
		'applyCorners'	: function() {
			/*
				Set up background offsets. This may need to be delayed until
				the background image is loaded.
			*/
			var backgroundPositionX = 0;
			var backgroundPositionY = 0;
			
			if ( this.backgroundObject ) {
			
				var bpx = this.css.get( 'backgroundPositionX' );
				var bpy = this.css.get( 'backgroundPositionY' );
				
				if ( ! /px$/.test( bpx ) || ! /px$/.test( bpy ) ) {
					if ( this.backgroundObject.complete ) {
						var w = this.css.get( 'width' ) - this.css.get( 'borderLeftWidth' ) - this.css.get( 'borderRightWidth' );
						var h = this.css.get( 'height' ) - this.css.get( 'borderTopWidth' ) - this.css.get( 'borderBottomWidth' );
						
						var bow = this.backgroundObject.width;
						var boh = this.backgroundObject.height;
						
						if ( /^(left|center|right)$/.test( bpx ) ) {
							switch ( bpx ) {
								case 'left':
									backgroundPositionX = 0;
									break;
								case 'center':
									backgroundPositionX = ( w - bow ) / 2;
									break;
								case 'right':
									backgroundPositionX = ( w - bow );
									break;
							}
						}
						else if ( ! /px$/.test( bpx ) ) {
							backgroundPositionX = ( w - bow ) * parseInt( bpx ) / 100;
						}
						else {
							backgroundPositionX = parseInt( bpx );
						}
						
						if ( /^(top|center|bottom)$/.test( bpy ) ) {
							switch ( bpy ) {
								case 'top':
									backgroundPositionY = 0;
									break;
								case 'center':
									backgroundPositionY = ( h - boh ) / 2;
									break;
								case 'bottom':
									backgroundPositionY = ( h - boh );
									break;
							}
						}
						else if ( ! /px$/.test( bpy ) ) {
							backgroundPositionY = ( h - boh ) * parseInt( bpy ) / 100;
						}
						else {
							backgroundPositionY = parseInt( bpy );
						}
					}
					else {
						setTimeout(
							function() {
								this.applyCorners();
							}.bind( this ),
							10
						);
						return;
					}
				}
				else {
					backgroundPositionX = parseInt( bpx );
					backgroundPositionY = parseInt( bpy );
				}
				
				backgroundPositionX = backgroundPositionX.round();
				backgroundPositionY = backgroundPositionY.round();
			}
			/*
				Create top and bottom containers.
				These will be used as a parent for the corners and bars.
			*/
			// Build top bar only if a top corner is to be drawn
			if ( this.topMaxRadius > 0 ) {
				this.topWrapper = new Element( 'div' );
				this.wrapper.insert( { top: this.topWrapper } );
				this.topWrapper.setStyle(
					{
						'width'		: this.css.get( 'width' ) + 'px',
						'fontSize'	: '1px',
						'overflow'	: 'hidden',
						'position'	: 'absolute',
						'padding'	: '0px',
						'height'	: this.topMaxRadius + 'px',
						'top'		: '0px'
					}
				);
			}
			// Build bottom bar only if a bottom corner is to be drawn
			if ( this.botMaxRadius > 0 ) {
				this.bottomWrapper = new Element( 'div' );
				this.wrapper.insert( { bottom: this.bottomWrapper } );
				this.bottomWrapper.setStyle(
					{
						'width'		: this.css.get( 'width' ) + 'px',
						'fontSize'	: '1px',
						'overflow'	: 'hidden',
						'position'	: 'absolute',
						'padding'	: '0px',
						'height'	: this.botMaxRadius + 'px',
						'bottom'	: '0px'
					}
				);
			}
			
			var corners = this.spec.cornerNames();  // array of available corners
					
			var w	= this.css.get( 'width' );
			var h	= this.css.get( 'height' );
			var blw	= this.css.get( 'borderLeftWidth' );
			var brw	= this.css.get( 'borderRightWidth' );
			var btw	= this.css.get( 'borderTopWidth' );
			var bbw	= this.css.get( 'borderBottomWidth' );
					
			var tlr = this.spec.getCorner( 'tlR' );
			var trr = this.spec.getCorner( 'trR' );
			var blr = this.spec.getCorner( 'blR' );
			var brr = this.spec.getCorner( 'brR' );
					
			var tbxw = w - Math.max( tlr, blw ) - Math.max( trr, brw );
			var bbxw = w - Math.max( blr, blw ) - Math.max( brr, brw );
					
			var tbpX = ( tlr < blw || tlr == 0 ) ? backgroundPositionX : ( backgroundPositionX - tlr + blw );
			var bbpX = ( blr < blw || tlr == 0 ) ? backgroundPositionX : ( backgroundPositionX - blr + blw );
			
			/*
				Loop for each corner
			*/
			corners.each(
				function( cc ) {
					var specRadius = this.spec.getCorner( cc + 'R' );
					var bwidth, bcolor, borderRadius;
					
					var newCorner = new Element( 'div' );
					
					var styles = $H({});
					
					if ( cc == 'tr' || cc == 'tl' ) {
						bwidth = btw;
						bcolor = this.css.get( 'borderTopColor' );
						
						this.topWrapper.insert( newCorner );
						
						styles.set( 'top', '0px' );
					}
					else {
						bwidth = bbw;
						bcolor = this.css.get( 'borderBottomColor' );
						
						this.bottomWrapper.insert( newCorner );
						
						styles.set( 'bottom', '0px' );
					}
					
					styles.set( ( /^(t|b)(l|r)$/.exec( cc )[2] == 'r' ? 'right' : 'left' ), '0px' );
					
					newCorner.setStyle( styles.toObject() );
					newCorner.setStyle(
						{
							'height'	: this.spec.getCorner( cc + 'Ru' ),
							'width'		: this.spec.getCorner( cc + 'Ru' ),
							'position'	: 'absolute',
							'fontSize'	: '1px'
						}
					);
					
					borderRadius = specRadius - bwidth;
					
					// THE FOLLOWING BLOCK OF CODE CREATES A ROUNDED CORNER
					// ---------------------------------------------------- TOP
					// IE8 bug fix???
					var trans = this.css.get( 'opacity' );
					// Cycle the x-axis
					for ( var intx = 0; intx < specRadius; ++intx ) {
						// Calculate the value of y1 which identifies the pixels inside the border
						var y1 = ( intx + 1 >= borderRadius ) ? -1 : Math.floor( Math.sqrt( Math.pow( borderRadius, 2 ) - Math.pow( intx + 1, 2 ) ) ) - 1;
						
						var inty, outsideColor;
						// Calculate y2 and y3 only if there is a border defined
						if ( borderRadius != specRadius ) {
							var y2 = ( intx >= borderRadius ) ? -1 : Math.ceil( Math.sqrt( Math.pow( borderRadius, 2 ) - Math.pow( intx, 2 ) ) );
							var y3 = ( intx + 1 >= specRadius ) ? -1 : Math.floor( Math.sqrt( Math.pow( specRadius, 2 ) - Math.pow( ( intx + 1 ), 2 ) ) ) - 1;
							
							// Cycle the y-axis
							if ( this.spec.antiAlias ) {
								for ( inty = y1 + 1; inty < y2; ++inty ) {
									// For each of the pixels that need anti aliasing between the foreground and border colour draw single pixel divs
									if ( this.css.get( 'backgroundImage' ) != '' ) {
										var borderFract = curvyUtils.pixelFraction( intx, inty, borderRadius ) * 100;
										this.drawPixel( intx, inty, bcolor, trans, 1, newCorner, borderFract >= 30, specRadius );
									}
									else if ( this.css.get( 'backgroundColor' ) !== 'transparent' ) {
										var pixelColor = curvyUtils.blendColor( this.css.get( 'backgroundColor' ), bcolor, curvyUtils.pixelFraction( intx, inty, borderRadius ) );
										this.drawPixel( intx, inty, pixelColor, trans, 1, newCorner, false, specRadius );
									}
									else {
										this.drawPixel( intx, inty, bcolor, trans >> 1, 1, newCorner, false, specRadius );
									}
								}
								// Draw bar for the border
								if ( y3 >= y2 ) {
									if ( y2 == -1 ) {
										y2 = 0;
									}
									this.drawPixel( intx, y2, bcolor, trans, ( y3 - y2 + 1 ), newCorner, false, 0 );
								}
								outsideColor = bcolor;  // Set the colour for the outside AA curve
								inty = y3;               // start_pos - 1 for y-axis AA pixels
							}
							else { // no antiAlias
								if ( y3 > y1 ) { // NB condition was >=, changed to avoid zero-height divs
									this.drawPixel( intx, ( y1 + 1 ), bcolor, trans, ( y3 - y1 ), newCorner, false, 0 );
								}
							}
						}
						else {
							outsideColor = this.css.get( 'backgroundColor' );  // Set the colour for the outside curve
							inty = y1;               // start_pos - 1 for y-axis AA pixels
						}					
						// Calculate y4
						var y4 = ( intx >= specRadius ) ? -1 : Math.ceil( Math.sqrt( Math.pow( specRadius, 2 ) - Math.pow( intx, 2 ) ) );
						// Draw bar on inside of the border with foreground colour
						if ( y1 > -1 ) {
							this.drawPixel( intx, 0, this.css.get( 'backgroundColor' ), trans, ( y1 + 1 ), newCorner, true, specRadius );
						}
						// Draw aa pixels?
						if ( this.spec.antiAlias ) {
							// Cycle the y-axis and draw the anti aliased pixels on the outside of the curve
							while ( ++inty < y4 ) {
								// For each of the pixels that need anti aliasing between the foreground/border colour & background draw single pixel divs
								//  - ( curvyUtils.isQuirksMode() ? 1 : 0 )
								this.drawPixel( intx, inty, outsideColor, ( curvyUtils.pixelFraction( intx, inty, specRadius ) * trans ), 1, newCorner, bwidth <= 0, specRadius );
							}
						}
					}
					
					// END OF CORNER CREATION
					// ---------------------------------------------------- END
					
					/*
						Now we have a new corner we need to reposition all the pixels unless
						the current corner is the bottom right.
					*/
					
					var bh = Math.max(
						h -
						this.topMaxRadius -
						this.botMaxRadius,
						0
					);
// 					 - (
// 						curvyUtils.isQuirksMode() ?
// 						0 :
// 						(
// 							(
// 								( this.topMaxRadius > 0 && btw > 0 && this.topMaxRadius < btw ) ?
// 								( btw - this.topMaxRadius ) :
// 								0
// 							) +
// 							(
// 								( this.botMaxRadius > 0 && bbw > 0 && this.botMaxRadius < bbw ) ?
// 								( bbw - this.botMaxRadius ) :
// 								0
// 							)
// 						)
// 					);
					
					// Loop through all children (pixel bars)
					
					newCorner.immediateDescendants().each(
						function ( pixelBar ) {
							// Get current top and left properties
							var pixelBarTop		= parseInt( pixelBar.getStyle( 'top' ) );
							var pixelBarLeft	= parseInt( pixelBar.getStyle( 'left' ) );
							var pixelBarHeight	= parseInt( pixelBar.getHeight() );
							
							var styles = $H({});
							
							// Reposition pixels
							if ( cc == 'tl' || cc == 'bl' ) {
								styles.set( 'left', ( specRadius - pixelBarLeft - 1 ) + 'px' ); // Left
							}
							if ( cc == 'tr' || cc == 'tl' ) {
								styles.set( 'top', ( specRadius - pixelBarHeight - pixelBarTop ) + 'px' ); // Top
							}
							
							styles.set( 'backgroundRepeat', this.css.get( 'backgroundRepeat' ) );
							
							if ( this.css.get( 'backgroundImage' ) != '' ) {
								
								switch( cc ) {
									case 'tr':
										styles.set(
											'backgroundPosition',
											(
												tbpX -
												tbxw -
												pixelBarLeft
											) + 'px ' +
											(
												backgroundPositionY +
												btw -
												specRadius +
												pixelBarHeight +
												pixelBarTop
											) + 'px'
										);
									break;
									case 'tl':
										styles.set(
											'backgroundPosition',
											(
												tbpX +
												pixelBarLeft +
												1
											) +
											'px ' +
											(
												backgroundPositionY +
												btw -
												specRadius +
												pixelBarHeight +
												pixelBarTop
											) +
											'px'
										);	
									break;
									case 'bl':
										styles.set(
											'backgroundPosition',
											(
												bbpX +
												pixelBarLeft +
												1
											) + 'px ' +
											(
												backgroundPositionY -
												this.topMaxRadius +
												btw -
												bh -
												( ( trr < tlr ) ? this.spec.radiusDiff( 't' ) : 0 )
											) + 'px' );
									break;
									case 'br':
										styles.set(
											'backgroundPosition',
											(
												bbpX -
												bbxw -
												pixelBarLeft
											) + 'px ' +
											(
												backgroundPositionY -
												this.topMaxRadius +
												btw -
												bh -
												( ( brr < blr ) ? this.spec.radiusDiff( 'b' ) : 0 )
											) + 'px'
										);
									//break;
								}
							}
							
							pixelBar.setStyle( styles.toObject() );
							
						}.bind( this )
					);
				}.bind( this )
			);					
			
			/*
				The last thing to do is draw the rest of the filler DIVs.
			*/
			
			$A( [ 't', 'b' ] ).each(
				function ( z ) {
					if ( ! this.spec.getCorner( z + 'R' ) ) {
						return;
					}
					
					if ( this.spec.radiusDiff( z ) > 0 && this.spec.radiusDiff( z ) != this.spec.radiusSum( z ) ) {
						// Get the type of corner that is the smaller one
						var smallerCornerType = ( this.spec.getCorner( z + 'lR' ) < this.spec.getCorner( z + 'rR' ) ) ? z + 'l' : z + 'r';
						
						var styles = $H({});
						
						var newFiller = new Element( 'div' );
						
						switch ( z ) {
							case 't' :
								this.topWrapper.insert( newFiller );
								var rd	= this.spec.radiusDiff( z );
								var sct	= this.spec.getCorner( smallerCornerType + 'R' );
								styles.update(
									{
										'bottom'		: '0px',
										'backgroundColor'	: sct <= btw ? this.css.get( 'borderTopColor' ) : this.css.get( 'backgroundColor' ),
										'height'		: ( curvyUtils.isQuirksMode() ? rd : rd - ( ( btw > sct ) ? ( btw - sct ) : 0 ) ) + 'px',
										'borderTop'		: ( btw < this.topMaxRadius && btw > sct ) ? ( btw - sct ) + 'px solid ' + this.css.get( 'borderTopColor' ) : 'none'
									}
								);
							break;
							case 'b' :
								this.bottomWrapper.insert( newFiller );
								var rd	= this.spec.radiusDiff( z );
								var sct	= this.spec.getCorner( smallerCornerType + 'R' );
								styles.update(
									{
										'top'		: '0px',
										'backgroundColor'	: sct <= bbw ? this.css.get( 'borderBottomColor' ) : this.css.get( 'backgroundColor' ),
										'height'	: ( curvyUtils.isQuirksMode() ? rd : rd - ( ( bbw > sct ) ? ( bbw - sct ) : 0 ) ) + 'px',
										'borderBottom'	: ( bbw < this.botMaxRadius && bbw > sct ) ? ( bbw - sct ) + 'px solid ' + this.css.get( 'borderBottomColor' ) : 'none'
									}
								);
						};
						
						styles.update(
							{
								'position'		: 'absolute',
								'fontSize'		: '1px'
							}
						);
						
						// Position filler
						if ( smallerCornerType == 'tl' || smallerCornerType == 'bl' ) {
							var cr	= this.spec.getCorner( smallerCornerType + 'R' );
							
							styles.update(
								{
									'left'		: '0px',
									'borderLeft'	: ( blw < cr ) ? blw + 'px solid ' + this.css.get( 'borderLeftColor' ) : 'none',
									'width'		: ( cr + ( ( curvyUtils.isQuirksMode() && blw < cr ) ? blw : 0 ) ) + 'px'
								}
							);
							
							if ( styles.get( 'backgroundColor' ) == this.css.get( 'backgroundColor' ) && blw >= cr ) {
								styles.set( 'backgroundColor', this.css.get( 'borderLeftColor' ) );
							}
						}
						else {
							var cr	= this.spec.getCorner( smallerCornerType + 'R' );
							
							styles.update(
								{
									'right'		: '0px',
									'borderRight'	: ( brw < cr ) ? brw + 'px solid ' + this.css.get( 'borderRightColor' ) : 'none',
									'width'		: ( cr + ( ( curvyUtils.isQuirksMode() && brw < cr ) ? brw : 0 ) ) + 'px'
								}
							);
							
							if ( styles.get( 'backgroundColor' ) == this.css.get( 'backgroundColor' ) && brw >= cr ) {
								styles.set( 'backgroundColor', this.css.get( 'borderRightColor' ) );
							}
						}
						
						if ( this.css.get( 'backgroundImage' ) != '' ) {
							
							var bh = Math.max(
								h -
								this.topMaxRadius -
								this.botMaxRadius,
								0
							) - (
								curvyUtils.isQuirksMode() ?
								0 :
								(
									(
										( this.topMaxRadius > 0 && btw > 0 && this.topMaxRadius < btw ) ?
										( btw - this.topMaxRadius ) :
										0
									) +
									(
										( this.botMaxRadius > 0 && bbw > 0 && this.botMaxRadius < bbw ) ?
										( bbw - this.botMaxRadius ) :
										0
									)
								)
							);
							
							var cr = this.spec.getCorner( smallerCornerType + 'R' );
							
							switch( smallerCornerType ) {
								case 'tr':
									if ( cr < this.topMaxRadius && brw < cr ) {
										styles.update(
											{
												'backgroundImage'	: this.css.get( 'backgroundImage' ),
												'backgroundRepeat'	: this.css.get( 'backgroundRepeat' ),
												'backgroundPosition'	: ( tbpX -
												tbxw + brw ) + 'px ' + ( backgroundPositionY + btw - this.topMaxRadius + parseInt( styles.get( 'height' ) ) ) + 'px'
											}
										);
									}
								break;
								case 'tl':
									if ( cr < this.topMaxRadius && blw < cr ) {
										styles.update(
											{
												'backgroundImage'	: this.css.get( 'backgroundImage' ),
												'backgroundRepeat'	: this.css.get( 'backgroundRepeat' ),
												'backgroundPosition'	: backgroundPositionX + 'px ' + ( backgroundPositionY + btw - this.topMaxRadius + parseInt( styles.get( 'height' ) ) ) + 'px'
											}
										);
									}
								break;
								case 'br':
									if ( cr < this.botMaxRadius && brw < cr ) {
										styles.update(
											{
												'backgroundImage'	: this.css.get( 'backgroundImage' ),
												'backgroundRepeat'	: this.css.get( 'backgroundRepeat' ),
												'backgroundPosition'	: ( tbpX -
												tbxw + brw ) + 'px ' + ( backgroundPositionY - this.topMaxRadius + btw - bh ) + 'px'
											}
										);
									}
								break;
								case 'bl':
									if ( cr < this.botMaxRadius && blw < cr ) {
										styles.update(
											{
												'backgroundImage'	: this.css.get( 'backgroundImage' ),
												'backgroundRepeat'	: this.css.get( 'backgroundRepeat' ),
												'backgroundPosition'	: backgroundPositionX + 'px ' + ( backgroundPositionY - this.topMaxRadius + btw - bh ) + 'px'
											}
										);
									}
							}
						}
						
						newFiller.setStyle( styles.toObject() );
						
					}
					// Create the bar to fill the gap between each corner horizontally
					
					var clr	= this.spec.getCorner( z + 'lR' );
					var crr	= this.spec.getCorner( z + 'rR' );
					
					var styles = $H(
						{
							'opacity'	: this.css.get( 'opacity' ),
							'position'	: 'absolute',
							'fontSize'	: '1px',
							'overflow'	: 'hidden',
							'width'		: ( w - Math.max( clr, blw ) - Math.max( crr, brw ) + ( curvyUtils.isQuirksMode() ? ( Math.max( blw - clr, 0 ) + Math.max( brw - crr, 0 ) ) : 0 ) ) + 'px',
							'left'		: this.spec.getCorner( z + 'lRu' ),
							'borderLeft'	: ( clr < blw ) ? ( ( blw - clr ) + 'px solid ' + this.css.get( 'borderLeftColor' ) ) : 'none',
							'borderRight'	: ( crr < brw ) ? ( ( brw - crr ) + 'px solid ' + this.css.get( 'borderRightColor' ) ) : 'none'
						}
					);
					
					if ( z == 't' ) {
						if ( this.topWrapper ) {
							
							if ( btw >= this.topMaxRadius ) {
								styles.update(
									{
										'backgroundColor'	: this.css.get( 'borderTopColor' ),
										'height'		: this.topMaxRadius + 'px'
									}
								);
							}
							else {
								styles.update(
									{
										'height'	: ( this.topMaxRadius - ( curvyUtils.isQuirksMode() ? 0 : btw ) ) + 'px',
										'backgroundImage'	: this.css.get( 'backgroundImage' ),
										'backgroundRepeat'	: this.css.get( 'backgroundRepeat' ),
										'backgroundColor'	: this.css.get( 'backgroundColor' ),
										'borderTop'		: this.css.get( 'borderTopWidth' ) + 'px solid ' + this.css.get( 'borderTopColor' )
									}
								);
								
								if ( this.css.get( 'backgroundImage' ) != '' ) {
									styles.set(
										'backgroundPosition',
										(
											( clr < blw || clr == 0 ) ?
											backgroundPositionX :
											(
												backgroundPositionX -
												clr +
												blw
											)
										) + 'px ' + backgroundPositionY + 'px'
									);
									
									this.box.setStyle(
										{
											'backgroundPosition'	: backgroundPositionX + 'px ' + ( backgroundPositionY - this.topMaxRadius + btw ) + 'px'
										}
									);
								}
							}
							
							var newFillerBar = new Element( 'div' );
							this.topWrapper.insert( newFillerBar );
							
							newFillerBar.setStyle( styles.toObject() );
						}
					}
					else {
						if ( this.bottomWrapper ) {
							
							if ( bbw >= this.botMaxRadius ) {
								styles.update(
									{
										'backgroundColor'	: this.css.get( 'borderBottomColor' ),
										'height'		: this.botMaxRadius + 'px'
									}
								);
							}
							else {
								styles.update(
									{
										'height'	: ( this.botMaxRadius - ( curvyUtils.isQuirksMode() ? 0 : bbw ) ) + 'px',
										'backgroundImage'	: this.css.get( 'backgroundImage' ),
										'backgroundRepeat'	: this.css.get( 'backgroundRepeat' ),
										'backgroundColor'	: this.css.get( 'backgroundColor' ),
										'borderBottom'		: bbw + 'px solid ' + this.css.get( 'borderBottomColor' )
									}
								);
								
								if ( this.css.get( 'backgroundImage' ) != '' ) {
									styles.set(
										'backgroundPosition',
										(
											( clr < blw || clr == 0 ) ?
											backgroundPositionX :
											(
												backgroundPositionX -
												clr +
												blw
											)
										) + 'px ' + ( backgroundPositionY - Math.max( h - this.topMaxRadius - this.botMaxRadius, 0 ) - this.topMaxRadius + btw )  + 'px' );
								}
							}
							
							var newFillerBar = new Element( 'div' );
							this.bottomWrapper.insert( newFillerBar );
							
							newFillerBar.setStyle( styles.toObject() );
						}
					}
				}.bind( this )
			);
			
			this.wrapper.addClassName( 'cornerWrapper' );
		},
		// append a pixel B to newCorner
		'drawPixel'	: function ( intx, inty, color, transAmount, height, newCorner, image, cornerRadius ) {
			var styles = $H(
				{
					'height'		: height,
					'width'			: '1px',
					'position'		: 'absolute',
					'fontSize'		: '1px',
					'overflow'		: 'hidden',
					'backgroundColor'	: color,
					'top'			: inty + 'px',
					'left'			: intx + 'px',
					'opacity'		: transAmount
				}
			);
			
			// Don't apply background image to border pixels
			if ( image && this.css.get( 'backgroundImage' ) != "" ) {
				styles.update(
					{
						'backgroundImage'	: this.css.get( 'backgroundImage' ),
						'backgroundPosition'	: '-' + ( this.css.get( 'width' ) - cornerRadius + intx + this.css.get( 'borderLeftWidth' ) ) + 'px -' + ( this.css.get( 'height' ) + this.topMaxRadius + inty - this.css.get( 'borderTopWidth' ) ) + 'px'
					}
				);
			}
			
			var pixel = new Element( 'b' );
			
			newCorner.insert( pixel );
			
			pixel.setStyle( styles.toObject() );
		},
		'errmsg'	: function ( msg, gravity ) {
			var extradata = "\ntag: " + this.box.tagName;
			if ( this.box.id ) {
				extradata += "\nid: " + this.box.id;
			}
			if ( this.box.className ) {
				extradata += "\nclass: " + this.box.className;
			}
			var parent;
			if ( ( parent = this.box.parentNode ) === null ) {
				extradata += "\n(box has no parent)";
			}
			else {
				extradata += "\nParent tag: " + parent.tagName;
				if ( parent.id ) {
					extradata += "\nParent ID: " + parent.id;
				}
				if ( parent.className ) {
					extradata += "\nParent class: " + parent.className;
				}
			}
			if ( gravity === undefined ) {
				gravity = 'warning';
			}
			return 'curvyObject ' + gravity + ":\n" + msg + extradata;
		},
		'newError'	: function ( msg ) {
			return new Error( this.errmsg( msg, 'exception' ) );
		}
	}
);

// ------------- UTILITY FUNCTIONS
//
// curvyUtils is just a namespace

var curvyUtils = new function () {
	var quirksMode = (
		Prototype.Browser.IE &&
		(
			! document.compatMode ||
			document.compatMode.indexOf("BackCompat") > -1
		)
	);
	
	return {
		'isQuirksMode'	: function() {
			return quirksMode;
		},
		/*
			Blends the two colours by the fraction
			returns the resulting colour as a string in the format "#FFFFFF"
		*/
		'blendColor'	: function ( color1, color2, color1Fraction ) {
			if ( color1 === 'transparent' || color2 === 'transparent' || color1 === '' || color2 === '' ) {
				return color2;
			}
			
			var colorRegExp = /#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})/i;
			
			if ( ! colorRegExp.match( color1 ) ) {
				color1 = curvyUtils.formatColor( color1 );
			}
			if ( ! colorRegExp.match( color2 ) ) {
				color2 = curvyUtils.formatColor( color2 );
			}
			
			var colorArray1 = colorRegExp.exec( color1 ).slice( 1 ).collect( function( val ) { return parseInt( val, 16 ); } );
			var colorArray2 = colorRegExp.exec( color2 ).slice( 1 ).collect( function( val ) { return parseInt( val, 16 ); } );
			
			if ( color1Fraction > 1 || color1Fraction < 0 ) {
				color1Fraction = 1;
			}
			
			var endRed	= Math.max( Math.min( Math.round( ( colorArray1[0] * color1Fraction ) + ( colorArray2[0] * ( 1 - color1Fraction ) ) ), 255 ), 0 );
			var endGreen	= Math.max( Math.min( Math.round( ( colorArray1[1] * color1Fraction ) + ( colorArray2[1] * ( 1 - color1Fraction ) ) ), 255 ), 0 );
			var endBlue	= Math.max( Math.min( Math.round( ( colorArray1[2] * color1Fraction ) + ( colorArray2[2] * ( 1 - color1Fraction ) ) ), 255 ), 0 );
			
			return "#" + endRed.toColorPart() + endGreen.toColorPart() + endBlue.toColorPart();
		},
		/*
			For a pixel cut by the line determines the fraction of the pixel on the 'inside' of the
			line.  Returns a number between 0 and 1
		*/
		'pixelFraction'	: function ( x, y, r ) {
			var rsquared = r * r;
			
			/*
				determine the co-ordinates of the two points on the perimeter of the pixel that the
				circle crosses
			*/
			var xvalues = [];
			var yvalues = [];
			var point = 0;
			var whatsides = '';
			
			// x + 0 = Left
			var intersect = Math.sqrt( rsquared - Math.pow( x, 2 ) );
			
			if ( intersect >= y && intersect < ( y + 1 ) ) {
				whatsides = "Left";
				xvalues[point] = 0;
				yvalues[point] = intersect - y;
				++point;
			}
			// y + 1 = Top
			intersect = Math.sqrt( rsquared - Math.pow( y + 1, 2 ) );
			
			if ( intersect >= x && intersect < ( x + 1 ) ) {
				whatsides += "Top";
				xvalues[point] = intersect - x;
				yvalues[point] = 1;
				++point;
			}
			// x + 1 = Right
			intersect = Math.sqrt( rsquared - Math.pow( x + 1, 2 ) );
			
			if ( intersect >= y && intersect < ( y + 1 ) ) {
				whatsides += "Right";
				xvalues[point] = 1;
				yvalues[point] = intersect - y;
				++point;
			}
			// y + 0 = Bottom
			intersect = Math.sqrt(rsquared - Math.pow(y, 2));
			
			if ( intersect >= x && intersect < ( x + 1 ) ) {
				whatsides += "Bottom";
				xvalues[point] = intersect - x;
				yvalues[point] = 0;
			}
			
			var fraction;
			/*
				depending on which sides of the perimeter of the pixel the circle crosses calculate the
				fraction of the pixel inside the circle
			*/
			switch (whatsides) {
				case "LeftRight":
					fraction = Math.min( yvalues[0], yvalues[1] ) + ( ( Math.max( yvalues[0], yvalues[1] ) - Math.min( yvalues[0], yvalues[1] ) ) / 2 );
				break;
				
				case "TopRight":
					fraction = 1 - ( ( ( 1 - xvalues[0] ) * ( 1 - yvalues[1] ) ) / 2 );
				break;
				
				case "TopBottom":
					fraction = Math.min( xvalues[0], xvalues[1] ) + ( ( Math.max( xvalues[0], xvalues[1] ) - Math.min( xvalues[0], xvalues[1] ) ) / 2 );
				break;
				
				case "LeftBottom":
					fraction = yvalues[0] * xvalues[1] / 2;
				break;
				
				default:
				fraction = 1;
			}
			
			return fraction;
		},
		// Returns an array of rgb values
		'rgb2Array'	: function ( rgbColor ) {
			var rgbRegExp = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/;
			
			return rgbRegExp.exec( rgbColor ).slice( 1 ).collect( function( val ) { return parseInt( val ); } );
		},
		// This function converts CSS rgb(x, x, x) to hexadecimal
		'rgb2Hex'	: function ( rgbColor ) {
			var rgbArray = curvyUtils.rgb2Array( rgbColor );
			
			return '#' + rgbArray[0].toColorPart() + rgbArray[1].toColorPart() + rgbArray[2].toColorPart();
		},
		// Gets the computed colour.
		'getComputedColor'	: function ( color ) {
			var div = new Element( 'div' );
			$$('body').first().insert( div );
			div.setStyle( { 'backgroundColor' : color } );
			
			if( window.getComputedStyle ) { // Mozilla, Opera, Chrome, Safari
				var css = document.defaultView.getComputedStyle( div, null );
				var bgc = css['backgroundColor'];
				div.remove();
				if ( /^rgb/.test( bgc ) ) bgc = curvyUtils.rgb2Hex( bgc );
				return bgc;
			}
			else { // IE
				var rng = document.body.createTextRange();
				rng.moveToElementText( div );
				rng.execCommand( 'ForeColor', false, color );
				var iClr = rng.queryCommandValue( 'ForeColor' );
				var rgb = "rgb(" + ( iClr & 0xFF ) + ", " + ( ( iClr & 0xFF00 ) >> 8 ) + ", " + ( ( iClr & 0xFF0000 ) >> 16 ) + ")";
				div.remove();
				rng = null;
				return curvyUtils.rgb2Hex( rgb );
			}
		},
		// convert colour name, rgb() and #RGB to #RRGGBB
		'formatColor'	: function ( color ) {
			// Make sure colour is set and not transparent
			if ( color != "" && color != "transparent" ) {
				// RGB Value?
				if ( /^rgb/.test( color ) ) {
					// Get HEX aquiv.
					color = curvyUtils.rgb2Hex( color );
				}
				else if ( ! color.startsWith( '#' ) ) {
					// Convert colour name to hex value
					color = curvyUtils.getComputedColor( color );
				}
				else if ( /#[a-f0-9]{3}$/i.test( color ) ) {
					// 3 chr colour code add remainder
					var arr = color.toArray();
					color = '#' + arr[1] + arr[1] + arr[2] + arr[2] + arr[3] + arr[3];
				}
			}
			if ( Object.isUndefined( color ) ) {
				color = '';
			}
			return color;
		}
	};
}

curvyCorners.versionCheck();

if (
	(
		typeof curvyCornersNoAutoScan === 'undefined' ||
		curvyCornersNoAutoScan === false
	) &&
	! Prototype.Browser.WebKit &&
	! Prototype.Browser.Gecko
) {
	Event.observe( window, 'load', curvyCorners.init );
}

Element.addMethods(
	'div',
	{
		'corner'	: function( element, settings ) {
			element = $( element );
			curvyCorners.applyCorners( settings, '#' + element.identify() );
			return element;
		}
	}
);

Element.Methods.setStyle = Element.Methods.setStyle.wrap(
	function ( origHandler, element, styleObj ) {
		var list = curvyCorners.getRedrawList();
		if ( element.tagName.toUpperCase() == 'DIV' && element.hasClassName( 'curvyRedraw' ) && list.length ) {
			list.each(
				function( el ) {
					if ( obj === $( el.get( 'nodeId' ) ) ) {
						var new_el = el.get( 'copy' ).clone( false );
						
						new_el.setStyle( styleObj );
						el.set(
							'copy',
							new_el
						);
						
						throw $break;
					}
				}
			);
			
			curvyCorners.setRedrawList( list );
			
			return element;
		}
		else {
			return origHandler( element, styleObj );
		}
	}
);
